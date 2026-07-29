"""
agent.py - Multi-Turn Tool Calling & Execution Engine (Python Version)
"""

import os
import json
import re
from typing import Tuple, List, Dict, Any
from tools import (
    TOOLS_SCHEMA, AVAILABLE_TOOLS, get_prayer_times,
    convert_gregorian_to_hijri, search_quran_verse,
    search_hadith, get_religious_days, calculate_time_difference
)

TURKEY_CITIES = [
    "adana", "adiyaman", "afyon", "afyonkarahisar", "agri", "amasya", "ankara", "antalya", "artvin", "aydin",
    "balikesir", "bilecik", "bingol", "bitlis", "bolu", "burdur", "bursa", "canakkale", "cankiri", "corum",
    "denizli", "diyarbakir", "edirne", "elazig", "erzincan", "erzurum", "eskisehir", "gaziantep", "giresun", "gumushane",
    "hakkari", "hatay", "isparta", "mersin", "icel", "istanbul", "izmir", "kars", "kastamonu", "kayseri",
    "kirklareli", "kirsehir", "kocaeli", "konya", "kutahya", "malatya", "manisa", "kahramanmaras", "maras", "mardin",
    "mugla", "mus", "nevsehir", "nigde", "ordu", "rize", "sakarya", "samsun", "siirt", "sinop",
    "sivas", "tekirdag", "tokat", "trabzon", "tunceli", "sanliurfa", "urfa", "usak", "van", "yozgat",
    "zonguldak", "aksaray", "bayburt", "karaman", "kirikkale", "batman", "sirnak", "bartin", "ardahan", "igdir",
    "yalova", "karabuk", "kilis", "osmaniye", "duzce", "londra", "london", "berlin", "mekke", "medine", "kudus"
]

def normalize_text(text: str) -> str:
    tr_map = {
        'ç': 'c', 'ğ': 'g', 'ı': 'i', 'i': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u',
        'Ç': 'c', 'Ğ': 'g', 'İ': 'i', 'I': 'i', 'Ö': 'o', 'Ş': 's', 'Ü': 'u'
    }
    res = text.lower()
    for k, v in tr_map.items():
        res = res.replace(k, v)
    return res

def extract_city(norm_query: str) -> str:
    words = re.findall(r'\b[a-z]+\b', norm_query)
    for word in words:
        if word in TURKEY_CITIES:
            if word == "mus": return "Mus"
            if word in ["maras", "kahramanmaras"]: return "Kahramanmaras"
            if word in ["urfa", "sanliurfa"]: return "Sanliurfa"
            if word in ["icel", "mersin"]: return "Mersin"
            return word.capitalize()
    return None

class IslamicAssistantAgent:
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.environ.get("GEMINI_API_KEY")
        self.use_llm = False

    def run(self, user_query: str) -> Tuple[str, List[Dict[str, Any]]]:
        trace_logs = []
        norm_query = normalize_text(user_query)
        collected_data = {}

        # ------------------------------------------
        # TURN 1: Birincil Araç Çağrıları
        # ------------------------------------------
        turn1_calls = []
        detected_city = extract_city(norm_query)

        # 1.1 Namaz Vakitleri (Şehir belirtildiyse veya vakit/ezan sorulduysa)
        wants_prayer = (detected_city is not None) or any(kw in norm_query for kw in ["ezan", "vakit", "imsak", "ogle", "ikindi", "aksam", "yatsi", "kac saat"])
        if wants_prayer:
            city_to_query = detected_city if detected_city else "Istanbul"
            turn1_calls.append({
                "tool": "get_prayer_times",
                "args": {"city": city_to_query, "country": "Turkey", "date": "today"}
            })

        # 1.2 Hicri Takvim
        if any(kw in norm_query for kw in ["hicri", "takvim", "tarih", "hangi gun", "gunu"]):
            turn1_calls.append({
                "tool": "convert_gregorian_to_hijri",
                "args": {"date": "today"}
            })

        # 1.3 Kur'an Ayet
        if any(kw in norm_query for kw in ["ayet", "kuran", "sure", "meal", "abdest", "oruc", "kadir", "sirala"]):
            term = "namaz"
            if "abdest" in norm_query: term = "abdest"
            elif "oruc" in norm_query: term = "oruc"
            elif "kadir" in norm_query: term = "kadir"

            turn1_calls.append({
                "tool": "search_quran_verse",
                "args": {"query": term}
            })

        # 1.4 Hadis
        if any(kw in norm_query for kw in ["hadis", "peygamber", "buhari", "muslim", "niyet", "guler yuz", "komsu", "ahlak", "fikih"]):
            term = "namaz"
            if "niyet" in norm_query: term = "niyet"
            elif "abdest" in norm_query: term = "abdest"

            turn1_calls.append({
                "tool": "search_hadith",
                "args": {"query": term}
            })

        # 1.5 Dini Günler
        if any(kw in norm_query for kw in ["kandil", "bayram", "ramazan ne zaman", "dini gun"]):
            turn1_calls.append({
                "tool": "get_religious_days",
                "args": {"year": 2026}
            })

        if not turn1_calls:
            turn1_calls.append({"tool": "search_quran_verse", "args": {"query": "namaz"}})
            turn1_calls.append({"tool": "search_hadith", "args": {"query": "namaz"}})

        # Turn 1 Çağrılarını Yürüt
        turn1_results = []
        for call in turn1_calls:
            tool_name = call["tool"]
            args = call["args"]
            fn = AVAILABLE_TOOLS[tool_name]
            result = fn(**args)
            collected_data[tool_name] = result
            turn1_results.append({
                "tool_name": tool_name,
                "input_arguments": args,
                "output_response": result
            })

        trace_logs.append({
            "turn_number": 1,
            "phase": "Birincil Araç Çağrıları (Turn 1)",
            "calls": turn1_results
        })

        # ------------------------------------------
        # TURN 2: İkincil Hesaplama Araçları
        # ------------------------------------------
        turn2_calls = []
        if "get_prayer_times" in collected_data and any(kw in norm_query for kw in ["kac saat", "kaldi", "fark", "aralarinda", "saat var"]):
            pt_data = collected_data["get_prayer_times"]
            if pt_data.get("status") == "success":
                times = pt_data["prayer_times"]
                target_time = times.get("Maghrib (Akşam)")
                if "ikindi" in norm_query: target_time = times.get("Asr (İkindi)")
                elif "yatsi" in norm_query: target_time = times.get("Isha (Yatsı)")
                elif "ogle" in norm_query: target_time = times.get("Dhuhr (Öğle)")

                turn2_calls.append({
                    "tool": "calculate_time_difference",
                    "args": {"time1": "now", "time2": target_time}
                })

        if turn2_calls:
            turn2_results = []
            for call in turn2_calls:
                tool_name = call["tool"]
                args = call["args"]
                fn = AVAILABLE_TOOLS[tool_name]
                result = fn(**args)
                collected_data[tool_name] = result
                turn2_results.append({
                    "tool_name": tool_name,
                    "input_arguments": args,
                    "output_response": result
                })

            trace_logs.append({
                "turn_number": 2,
                "phase": "İkincil Hesaplama Araç Çağrıları (Turn 2)",
                "calls": turn2_results
            })

        # ------------------------------------------
        # TURN 3: Sentez ve Yanıt
        # ------------------------------------------
        final_answer = self._synthesize_final_response(user_query, collected_data)
        return final_answer, trace_logs

    def _synthesize_final_response(self, user_query: str, tool_data: Dict[str, Any]) -> str:
        sections = []
        citations = []

        if "get_prayer_times" in tool_data:
            pt = tool_data["get_prayer_times"]
            if pt.get("status") == "success":
                city = pt["city"]
                times = pt["prayer_times"]
                sections.append(
                    f"📍 **{city} için Bugünün Ezan/Namaz Vakitleri:**\n"
                    f"• **İmsak:** {times['Fajr (İmsak)']}\n"
                    f"• **Güneş:** {times['Sunrise (Güneş)']}\n"
                    f"• **Öğle:** {times['Dhuhr (Öğle)']}\n"
                    f"• **İkindi:** {times['Asr (İkindi)']}\n"
                    f"• **Akşam:** {times['Maghrib (Akşam)']}\n"
                    f"• **Yatsı:** {times['Isha (Yatsı)']}"
                )
                citations.append(f"• Namaz Vakitleri Kaynağı: {pt.get('source', 'Aladhan Servisi')}")

        if "calculate_time_difference" in tool_data:
            td = tool_data["calculate_time_difference"]
            if td.get("status") == "success":
                sections.append(
                    f"⏳ **Hedef Vakte Kalan Süre:**\n"
                    f"Şu anki saatten hedef ezan vaktine ({td['to_time']}) yaklaşık **{td['formatted_difference']}** bulunmaktadır."
                )

        if "convert_gregorian_to_hijri" in tool_data:
            hj = tool_data["convert_gregorian_to_hijri"]
            if hj.get("status") == "success":
                sections.append(
                    f"📅 **Hicri Takvim Bilgisi:**\n"
                    f"Bugün Hicri takvime göre **{hj['full_hijri_date']}** günüdür."
                )
                citations.append(f"• Takvim Kaynağı: {hj.get('source', 'Aladhan Hijri Converter')}")

        if "search_quran_verse" in tool_data:
            qv = tool_data["search_quran_verse"]
            if qv.get("status") == "success":
                sections.append(
                    f"📖 **Kur'an-ı Kerim Rehberliği:**\n"
                    f"*{qv['turkish_translation']}*\n"
                    f"👉 **Ayet Referansı:** `{qv['citation']}`"
                )
                citations.append(f"• Ayet Meali Kaynağı: {qv['citation']}")

        if "search_hadith" in tool_data:
            hd = tool_data["search_hadith"]
            if hd.get("status") == "success":
                sections.append(
                    f"💬 **Hadis-i Şerif Referansı:**\n"
                    f"*{hd['hadith_text']}*\n"
                    f"👉 **Hadis Kaynağı:** `{hd['citation']}`"
                )
                citations.append(f"• Hadis Kaynağı: {hd['citation']}")

        if "get_religious_days" in tool_data:
            rd = tool_data["get_religious_days"]
            if rd.get("status") == "success":
                upcoming = rd["events"][:4]
                event_str = "\n".join([f"• **{e['event']}:** {e['date']} ({e['hijri']})" for e in upcoming])
                sections.append(
                    f"🌙 **Önümüzdeki Dini Gün ve Geceler ({rd['year']}):**\n{event_str}"
                )
                citations.append(f"• Dini Günler Kaynağı: {rd.get('source', 'Diyanet Takvimi')}")

        body = "\n\n---\n\n".join(sections)
        citations_unique = list(set(citations))
        citations_formatted = "\n".join(citations_unique)
        
        return (
            f"{body}\n\n"
            f"📚 **Resmi Veri Kaynakları:**\n"
            f"{citations_formatted}\n\n"
            f"Allah ibadetlerinizi kabul buyursun. Başka bir sorunuz veya öğrenmek istediğiniz vakit var mı?"
        )
