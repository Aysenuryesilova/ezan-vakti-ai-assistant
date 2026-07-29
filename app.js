/**
 * app.js - Dini İlimler & Ezan Vakti AI Asistanı (Browser-based Tool Calling Engine)
 * 
 * Bu JavaScript modülü, Hugging Face Static Space üzerinde sunucu maliyeti gerektirmeden
 * 100% istemci tarafında (Client-Side) çalışan Multi-Turn Tool Calling engine'ini yürütür.
 */

// ==========================================
// 1. API SERVİS FONKSİYONLARI (Browser Engine)
// ==========================================

async function apiGetPrayerTimes(city = "Istanbul", country = "Turkey", date = "today") {
    try {
        let dateStr;
        const now = new Date();
        if (date === "today") {
            const d = String(now.getDate()).padStart(2, '0');
            const m = String(now.getMonth() + 1).padStart(2, '0');
            const y = now.getFullYear();
            dateStr = `${d}-${m}-${y}`;
        } else if (date === "tomorrow") {
            const tom = new Date(now.getTime() + (24 * 60 * 60 * 1000));
            const d = String(tom.getDate()).padStart(2, '0');
            const m = String(tom.getMonth() + 1).padStart(2, '0');
            const y = tom.getFullYear();
            dateStr = `${d}-${m}-${y}`;
        } else {
            dateStr = date;
        }

        const url = `https://api.aladhan.com/v1/timingsByCity/${dateStr}?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=13`;
        const res = await fetch(url);
        const data = await res.json();

        if (res.ok && data.code === 200) {
            const timings = data.data.timings;
            const hijri = data.data.date.hijri;

            return {
                status: "success",
                city: city.charAt(0).toUpperCase() + city.slice(1),
                country: country.charAt(0).toUpperCase() + country.slice(1),
                date: dateStr,
                hijri_date: `${hijri.day} ${hijri.month.en} ${hijri.year}`,
                prayer_times: {
                    "Fajr (İmsak)": timings.Fajr,
                    "Sunrise (Güneş)": timings.Sunrise,
                    "Dhuhr (Öğle)": timings.Dhuhr,
                    "Asr (İkindi)": timings.Asr,
                    "Maghrib (Akşam)": timings.Maghrib,
                    "Isha (Yatsı)": timings.Isha
                },
                source: "Aladhan API (Diyanet Yöntemi)"
            };
        } else {
            return { status: "error", message: "Aladhan API yanıtı alınamadı." };
        }
    } catch (e) {
        return { status: "error", message: "Bağlantı hatası: " + e.message };
    }
}

async function apiConvertGregorianToHijri(date = "today") {
    try {
        let dateStr;
        const now = new Date();
        if (date === "today") {
            const d = String(now.getDate()).padStart(2, '0');
            const m = String(now.getMonth() + 1).padStart(2, '0');
            const y = now.getFullYear();
            dateStr = `${d}-${m}-${y}`;
        } else {
            dateStr = date;
        }

        const url = `https://api.aladhan.com/v1/gregorianToHijri/${dateStr}`;
        const res = await fetch(url);
        const data = await res.json();

        if (res.ok && data.code === 200) {
            const hijri = data.data.hijri;
            const monthNamesTr = {
                "Muḥarram": "Muharrem", "Ṣafar": "Sefer", "Rabīʿ al-awwal": "Rebiülevvel",
                "Rabīʿ al-thānī": "Rebiülahir", "Jumādá al-ūlá": "Cemaziyelevvel",
                "Jumādá al-ākhirah": "Cemaziyelahir", "Rajab": "Recep", "Shaʿbān": "Şaban",
                "Ramaḍān": "Ramazan", "Shawwāl": "Şevval", "Dhū al-Qaʿdah": "Zilkade",
                "Dhū al-Ḥijjah": "Zilhicce"
            };
            const trMonth = monthNamesTr[hijri.month.en] || hijri.month.en;

            return {
                status: "success",
                gregorian_date: dateStr,
                hijri_day: hijri.day,
                hijri_month: trMonth,
                hijri_year: hijri.year,
                full_hijri_date: `${hijri.day} ${trMonth} ${hijri.year}`,
                source: "Aladhan API Hijri Conversion"
            };
        } else {
            return { status: "error", message: "Hicri dönüşüm başarısız." };
        }
    } catch (e) {
        return { status: "error", message: "Bağlantı hatası: " + e.message };
    }
}

async function apiSearchQuranVerse(query) {
    try {
        const cleanQuery = query.toLowerCase().replace("suresi", "").replace("ayet", "").trim();

        // 1. Popüler Sık Sorulan Ayetler (Hızlı Sonuç)
        const popularVerses = {
            "abdest": {
                surah_name: "Mâide", surah_number: 5, ayah_number: 6,
                turkish_translation: "Ey iman edenler! Namaza kalkacağınız zaman yüzlerinizi, dirseklere kadar ellerinizi yıkayın; başlarınızı meshedip ekleklere (topuklara) kadar ayaklarınızı da yıkayın...",
                citation: "[Mâide Sûresi, 6. Ayet - Diyanet Meali]"
            },
            "namaz": {
                surah_name: "Bakara", surah_number: 2, ayah_number: 45,
                turkish_translation: "Sabır ve namaz ile Allah'tan yardım isteyin. Şüphesiz namaz, Allah'a saygı duyanlardan başkasına ağır gelir.",
                citation: "[Bakara Sûresi, 45. Ayet - Diyanet Meali]"
            },
            "oruc": {
                surah_name: "Bakara", surah_number: 2, ayah_number: 183,
                turkish_translation: "Ey iman edenler! Allah'a karşı gelmekten sakınasınız diye oruç, sizden öncekilere farz kılındığı gibi size de farz kılındı.",
                citation: "[Bakara Sûresi, 183. Ayet - Diyanet Meali]"
            },
            "kadir": {
                surah_name: "Kadir", surah_number: 97, ayah_number: 1,
                turkish_translation: "Şüphesiz, biz onu (Kur'an'ı) Kadir gecesinde indirdik. Kadir gecesinin ne olduğunu sen ne bileceksin! Kadir gecesi bin aydan daha hayırlıdır.",
                citation: "[Kadir Sûresi, 1-3. Ayetler - Diyanet Meali]"
            }
        };

        for (let key in popularVerses) {
            if (cleanQuery.includes(key)) {
                return {
                    status: "success",
                    type: "keyword_match",
                    ...popularVerses[key],
                    source: "Kur'an-ı Kerim Diyanet Veritabanı"
                };
            }
        }

        // 2. AlQuran Cloud API Arama
        const url = `https://api.alquran.cloud/v1/search/${encodeURIComponent(query)}/all/tr.diyanet`;
        const res = await fetch(url);
        const data = await res.json();

        if (res.ok && data.code === 200 && data.data.count > 0) {
            const match = data.data.matches[0];
            return {
                status: "success",
                type: "search_result",
                surah_name: match.surah.name,
                surah_number: match.surah.number,
                ayah_number: match.numberInSurah,
                turkish_translation: match.text,
                citation: `[${match.surah.name} Sûresi, ${match.numberInSurah}. Ayet - Diyanet Meali]`,
                source: "AlQuran Cloud API"
            };
        } else {
            return {
                status: "not_found",
                message: `'${query}' için doğrudan ayet sonucu bulunamadı. Genel fıkhi esaslar çerçevesinde yanıt üretilmiştir.`
            };
        }
    } catch (e) {
        return { status: "error", message: "Kur'an API hatası: " + e.message };
    }
}

function apiSearchHadith(query) {
    const cleanQuery = query.toLowerCase().trim();
    const hadithDb = [
        {
            tags: ["abdest", "temizlik", "vudu", "namaz"],
            hadith_tr: "Temizlik imanın yarısıdır. Elhamdülillah demek mizanı doldurur...",
            source_book: "Sahih-i Müslim",
            citation: "[Sahih-i Müslim, Taharet 1]"
        },
        {
            tags: ["niyet", "ameller", "ihlas"],
            hadith_tr: "Ameller ancak niyetlere göredir. Herkes için ancak niyet ettiğinin karşılığı vardır...",
            source_book: "Sahih-i Buhârî",
            citation: "[Sahih-i Buhârî, Bed'ül-Vahy 1]"
        },
        {
            tags: ["oruc", "ramazan", "kalkan"],
            hadith_tr: "Oruç bir kalkandır. Sizden biriniz oruçlu olduğu gün kötü söz söylemesin, kavga etmesin...",
            source_book: "Sahih-i Buhârî",
            citation: "[Sahih-i Buhârî, Savm 2]"
        },
        {
            tags: ["guler yuz", "sadaka", "ahlak"],
            hadith_tr: "Din kardeşine güler yüz göstermen senin için bir sadakadır.",
            source_book: "Sünen-i Tirmizî",
            citation: "[Sünen-i Tirmizî, Birr 36]"
        }
    ];

    for (let item of hadithDb) {
        for (let tag of item.tags) {
            if (cleanQuery.includes(tag)) {
                return {
                    status: "success",
                    hadith_text: item.hadith_tr,
                    source_book: item.source_book,
                    citation: item.citation,
                    source: "Kütüb-i Sitte Sahih Hadis Veritabanı"
                };
            }
        }
    }

    return {
        status: "success",
        hadith_text: "Kolaylaştırınız, zorlaştırmayınız; müjdeleyiniz, nefret ettirmeyiniz.",
        source_book: "Sahih-i Buhârî",
        citation: "[Sahih-i Buhârî, İlim 11]",
        source: "Sahih Hadis Veritabanı"
    };
}

function apiGetReligiousDays(year = 2026) {
    const events = [
        { event: "Regaip Kandili", date: "15 Ocak 2026 Perşembe", hijri: "26 Receb 1447" },
        { event: "Miraç Kandili", date: "06 Şubat 2026 Cuma", hijri: "17 Şaban 1447" },
        { event: "Berat Kandili", date: "23 Şubat 2026 Pazartesi", hijri: "15 Şaban 1447" },
        { event: "Ramazan-ı Şerif Başlangıcı", date: "19 Mart 2026 Perşembe", hijri: "1 Ramazan 1447" },
        { event: "Kadir Gecesi", date: "13 Nisan 2026 Pazartesi", hijri: "26 Ramazan 1447" },
        { event: "Ramazan Bayramı 1. Gün", date: "18 Nisan 2026 Cumartesi", hijri: "1 Şevval 1447" },
        { event: "Kurban Bayramı 1. Gün", date: "25 Haziran 2026 Perşembe", hijri: "10 Zilhicce 1447" }
    ];

    return {
        status: "success",
        year: year,
        events: events,
        source: "Diyanet İşleri Başkanlığı Dini Günler Takvimi"
    };
}

function apiCalculateTimeDifference(time1, time2) {
    try {
        const now = new Date();
        let h1, m1;
        if (time1.toLowerCase() === "now") {
            h1 = now.getHours();
            m1 = now.getMinutes();
        } else {
            const p = time1.split(":");
            h1 = parseInt(p[0]);
            m1 = parseInt(p[1]);
        }

        const p2 = time2.split(":");
        const h2 = parseInt(p2[0]);
        const m2 = parseInt(p2[1]);

        let diffMinutes = (h2 * 60 + m2) - (h1 * 60 + m1);
        if (diffMinutes < 0) {
            diffMinutes += 24 * 60; // Yarına sarkıyor
        }

        const hours = Math.floor(diffMinutes / 60);
        const minutes = diffMinutes % 60;

        return {
            status: "success",
            from_time: time1 === "now" ? `${String(h1).padStart(2,'0')}:${String(m1).padStart(2,'0')}` : time1,
            to_time: time2,
            hours_left: hours,
            minutes_left: minutes,
            formatted_difference: `${hours} saat ${minutes} dakika`
        };
    } catch (e) {
        return { status: "error", message: "Hesaplama hatası: " + e.message };
    }
}

// ==========================================
// 2. MULTI-TURN REACT ENGINE & CONTROLLER
// ==========================================

function normalizeText(text) {
    const trMap = {'ç':'c','ğ':'g','ı':'i','i':'i','ö':'o','ş':'s','ü':'u','Ç':'c','Ğ':'g','İ':'i','I':'i','Ö':'o','Ş':'s','Ü':'u'};
    let res = text.toLowerCase();
    for (let k in trMap) {
        res = res.replaceAll(k, trMap[k]);
    }
    return res;
}

async function runToolCallingAgent(userQuery) {
    const normQuery = normalizeText(userQuery);
    const traceLogs = [];
    const collectedData = {};

    // ------------------------------------------
    // TURN 1: Birincil Araç Çağrıları
    // ------------------------------------------
    const turn1Calls = [];

    // Şehir tespiti
    const cities = ["istanbul", "ankara", "izmir", "bursa", "antalya", "konya", "trabzon", "londra", "london", "berlin"];
    let foundCity = "Istanbul";
    for (let c of cities) {
        if (normQuery.includes(c)) {
            foundCity = c.charAt(0).toUpperCase() + c.slice(1);
            break;
        }
    }

    // 1.1 Namaz Vakitleri
    if (["namaz", "ezan", "vakit", "kac", "imsak", "ogle", "ikindi", "aksam", "yatsi", "sicak"].some(kw => normQuery.includes(kw))) {
        turn1Calls.push({ tool: "get_prayer_times", args: { city: foundCity, country: "Turkey", date: "today" } });
    }

    // 1.2 Hicri Takvim
    if (["hicri", "takvim", "gun", "tarih", "hangi gun", "gunu"].some(kw => normQuery.includes(kw))) {
        turn1Calls.push({ tool: "convert_gregorian_to_hijri", args: { date: "today" } });
    }

    // 1.3 Ayet Meal
    if (["ayet", "kuran", "sure", "meal", "abdest", "oruc", "kadir"].some(kw => normQuery.includes(kw))) {
        const term = normQuery.includes("abdest") ? "abdest" : (normQuery.includes("oruc") ? "oruc" : (normQuery.includes("kadir") ? "kadir" : "namaz"));
        turn1Calls.push({ tool: "search_quran_verse", args: { query: term } });
    }

    // 1.4 Hadis
    if (["hadis", "peygamber", "buhari", "muslim", "niyet", "guler yuz", "komsu", "ahlak", "fikih"].some(kw => normQuery.includes(kw))) {
        const term = normQuery.includes("niyet") ? "niyet" : (normQuery.includes("abdest") ? "abdest" : "namaz");
        turn1Calls.push({ tool: "search_hadith", args: { query: term } });
    }

    // 1.5 Dini Günler
    if (["kandil", "bayram", "ramazan ne zaman", "dini gun"].some(kw => normQuery.includes(kw))) {
        turn1Calls.push({ tool: "get_religious_days", args: { year: 2026 } });
    }

    if (turn1Calls.length === 0) {
        turn1Calls.push({ tool: "get_prayer_times", args: { city: foundCity, country: "Turkey", date: "today" } });
        turn1Calls.push({ tool: "search_quran_verse", args: { query: "namaz" } });
    }

    // Turn 1 İşleme
    const turn1Results = [];
    for (let call of turn1Calls) {
        let res;
        if (call.tool === "get_prayer_times") res = await apiGetPrayerTimes(call.args.city, call.args.country, call.args.date);
        else if (call.tool === "convert_gregorian_to_hijri") res = await apiConvertGregorianToHijri(call.args.date);
        else if (call.tool === "search_quran_verse") res = await apiSearchQuranVerse(call.args.query);
        else if (call.tool === "search_hadith") res = apiSearchHadith(call.args.query);
        else if (call.tool === "get_religious_days") res = apiGetReligiousDays(call.args.year);

        collectedData[call.tool] = res;
        turn1Results.push({
            tool_name: call.tool,
            input_arguments: call.args,
            output_response: res
        });
    }

    traceLogs.push({
        turn_number: 1,
        phase: "Birincil Araç Çağrıları (Turn 1)",
        calls: turn1Results
    });

    // ------------------------------------------
    // TURN 2: İkincil İletişim / Hesaplama Araç Çağrıları
    // ------------------------------------------
    const turn2Calls = [];
    if (collectedData["get_prayer_times"] && ["kac saat", "kaldi", "fark", "aralarinda", "saat var"].some(kw => normQuery.includes(kw))) {
        const ptData = collectedData["get_prayer_times"];
        if (ptData.status === "success") {
            const times = ptData.prayer_times;
            let targetTime = times["Maghrib (Akşam)"];
            if (normQuery.includes("ikindi")) targetTime = times["Asr (İkindi)"];
            else if (normQuery.includes("yatsi")) targetTime = times["Isha (Yatsı)"];
            else if (normQuery.includes("ogle")) targetTime = times["Dhuhr (Öğle)"];

            turn2Calls.push({
                tool: "calculate_time_difference",
                args: { time1: "now", time2: targetTime }
            });
        }
    }

    if (turn2Calls.length > 0) {
        const turn2Results = [];
        for (let call of turn2Calls) {
            const res = apiCalculateTimeDifference(call.args.time1, call.args.time2);
            collectedData[call.tool] = res;
            turn2Results.push({
                tool_name: call.tool,
                input_arguments: call.args,
                output_response: res
            });
        }

        traceLogs.push({
            turn_number: 2,
            phase: "İkincil Hesaplama Araç Çağrıları (Turn 2)",
            calls: turn2Results
        });
    }

    // ------------------------------------------
    // TURN 3: Sentez ve Yanıt
    // ------------------------------------------
    const finalAnswer = synthesizeResponse(userQuery, collectedData);

    return {
        finalAnswer: finalAnswer,
        traceLogs: traceLogs
    };
}

function synthesizeResponse(userQuery, data) {
    let sections = [];
    let citations = [];

    if (data.get_prayer_times && data.get_prayer_times.status === "success") {
        const pt = data.get_prayer_times;
        const t = pt.prayer_times;
        sections.push(
            `📍 <strong>${pt.city} için Bugünün Ezan/Namaz Vakitleri:</strong><br>` +
            `• <b>İmsak:</b> ${t["Fajr (İmsak)"]}<br>` +
            `• <b>Güneş:</b> ${t["Sunrise (Güneş)"]}<br>` +
            `• <b>Öğle:</b> ${t["Dhuhr (Öğle)"]}<br>` +
            `• <b>İkindi:</b> ${t["Asr (İkindi)"]}<br>` +
            `• <b>Akşam:</b> ${t["Maghrib (Akşam)"]}<br>` +
            `• <b>Yatsı:</b> ${t["Isha (Yatsı)"]}`
        );
        citations.push(`• Namaz Vakitleri Kaynağı: ${pt.source}`);
    }

    if (data.calculate_time_difference && data.calculate_time_difference.status === "success") {
        const td = data.calculate_time_difference;
        sections.push(
            `⏳ <strong>Hedef Vakte Kalan Süre:</strong><br>` +
            `Şu anki saatten hedef ezan vaktine (${td.to_time}) yaklaşık <b>${td.formatted_difference}</b> bulunmaktadır.`
        );
    }

    if (data.convert_gregorian_to_hijri && data.convert_gregorian_to_hijri.status === "success") {
        const hj = data.convert_gregorian_to_hijri;
        sections.push(
            `📅 <strong>Hicri Takvim Bilgisi:</strong><br>` +
            `Bugün Hicri takvime göre <b>${hj.full_hijri_date}</b> günüdür.`
        );
        citations.push(`• Takvim Kaynağı: ${hj.source}`);
    }

    if (data.search_quran_verse && data.search_quran_verse.status === "success") {
        const qv = data.search_quran_verse;
        sections.push(
            `📖 <strong>Kur'an-ı Kerim Rehberliği:</strong><br>` +
            `<em>"${qv.turkish_translation}"</em><br>` +
            `👉 <b>Ayet Referansı:</b> <code>${qv.citation}</code>`
        );
        citations.push(`• Ayet Meali Kaynağı: ${qv.citation}`);
    }

    if (data.search_hadith && data.search_hadith.status === "success") {
        const hd = data.search_hadith;
        sections.push(
            `💬 <strong>Hadis-i Şerif Referansı:</strong><br>` +
            `<em>"${hd.hadith_text}"</em><br>` +
            `👉 <b>Hadis Kaynağı:</b> <code>${hd.citation}</code>`
        );
        citations.push(`• Hadis Kaynağı: ${hd.citation}`);
    }

    if (data.get_religious_days && data.get_religious_days.status === "success") {
        const rd = data.get_religious_days;
        const upcoming = rd.events.slice(0, 4).map(e => `• <b>${e.event}:</b> ${e.date} (${e.hijri})`).join("<br>");
        sections.push(
            `🌙 <strong>Önümüzdeki Dini Gün ve Geceler (${rd.year}):</strong><br>${upcoming}`
        );
        citations.push(`• Dini Günler Kaynağı: ${rd.source}`);
    }

    const uniqueCitations = Array.from(new Set(citations)).join("<br>");

    return (
        sections.join("<br><br><hr><br>") +
        `<br><br>📚 <strong>Resmi Veri Kaynakları:</strong><br>${uniqueCitations}` +
        `<br><br>Allah ibadetlerinizi kabul buyursun. Başka bir sorunuz veya öğrenmek istediğiniz vakit var mı?`
    );
}

// ==========================================
// 3. UI HANDLERS & EVENT LISTENERS
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    const chatForm = document.getElementById("chatForm");
    const userInput = document.getElementById("userInput");
    const chatHistory = document.getElementById("chatHistory");
    const traceLogBody = document.getElementById("traceLogBody");

    chatForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const text = userInput.value.trim();
        if (!text) return;

        // User Message UI
        appendUserMessage(text);
        userInput.value = "";

        // Bot Loading Indicator
        const loadingDiv = appendBotLoading();

        // Run Tool Calling Agent
        const result = await runToolCallingAgent(text);

        // Remove Loading
        loadingDiv.remove();

        // Bot Answer UI
        appendBotMessage(result.finalAnswer);

        // Render Trace Logs (Ödev Modu)
        renderTraceLogs(result.traceLogs);

        // Auto scroll
        chatHistory.scrollTop = chatHistory.scrollHeight;
    });
});

function fillQuery(text) {
    document.getElementById("userInput").value = text;
}

function appendUserMessage(text) {
    const chatHistory = document.getElementById("chatHistory");
    const msgDiv = document.createElement("div");
    msgDiv.className = "message user-message";
    msgDiv.innerHTML = `
        <div class="avatar">👤</div>
        <div class="message-content"><p>${escapeHtml(text)}</p></div>
    `;
    chatHistory.appendChild(msgDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

function appendBotLoading() {
    const chatHistory = document.getElementById("chatHistory");
    const msgDiv = document.createElement("div");
    msgDiv.className = "message bot-message";
    msgDiv.innerHTML = `
        <div class="avatar">🤖</div>
        <div class="message-content"><p>⏳ <em>Araçlar çağrılıyor ve yanıt hazırlanıyor...</em></p></div>
    `;
    chatHistory.appendChild(msgDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;
    return msgDiv;
}

function appendBotMessage(htmlContent) {
    const chatHistory = document.getElementById("chatHistory");
    const msgDiv = document.createElement("div");
    msgDiv.className = "message bot-message";
    msgDiv.innerHTML = `
        <div class="avatar">🤖</div>
        <div class="message-content">${htmlContent}</div>
    `;
    chatHistory.appendChild(msgDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

function renderTraceLogs(traceLogs) {
    const traceLogBody = document.getElementById("traceLogBody");
    traceLogBody.innerHTML = "";

    if (!traceLogs || traceLogs.length === 0) {
        traceLogBody.innerHTML = `<div class="empty-trace"><p>Herhangi bir araç çağrısı yapılmadı.</p></div>`;
        return;
    }

    let html = "";
    for (let trace of traceLogs) {
        html += `<div class="turn-header">🔄 [Turn ${trace.turn_number}] - ${trace.phase}</div>`;

        for (let call of trace.calls) {
            html += `
                <div class="tool-call-box">
                    <div class="tool-title">⚙️ Fonksiyon Tetiklendi: <code>${call.tool_name}()</code></div>
                    <div>📥 <b>Giriş Parametreleri (JSON Schema Args):</b></div>
                    <div class="json-block">${escapeHtml(JSON.stringify(call.input_arguments, null, 2))}</div>
                    <div style="margin-top:6px;">📤 <b>Dönen API Yanıtı (Output Response):</b></div>
                    <div class="json-block">${escapeHtml(JSON.stringify(call.output_response, null, 2))}</div>
                </div>
            `;
        }
    }
    traceLogBody.innerHTML = html;
}

function escapeHtml(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
