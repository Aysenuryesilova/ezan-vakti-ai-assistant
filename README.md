---
title: Dini Ilimler Ve Ezan Vakti AI Asistani
emoji: 🕌
colorFrom: blue
colorTo: indigo
sdk: static
pinned: false
license: mit
---

# 🕌 Dini İlimler & Ezan Vakti AI Asistanı (Tool Calling System)

Bu proje, açık veri kaynakları (Public APIs) ve istemci tarafı Multi-Turn Tool Calling mimarisi kullanılarak geliştirilmiş, **Dini İlimler, Kur'an-ı Kerim Mealleri, Sahih Hadis-i Şerifler, Diyanet İlmihali ve Ezan Vakitleri** AI asistanıdır.

---

## 🌟 Proje Özellikleri

1. **Çoklu Public API Entegrasyonu (Multi-API)**:
   - **Aladhan REST API**: Diyanet İşleri Başkanlığı hesaplama yöntemiyle (Method 13) 81 il ve tüm ilçeler için ezan vakitleri ve Hicri takvim dönüşümü.
   - **AlQuran Cloud REST API**: Kur'an-ı Kerim 114 Sûre, Arapça Uthmani metinler ve Diyanet Meali.
   - **Sahih Hadis Veritabanı Servisi**: Kütüb-i Sitte (Buhari, Müslim, Tirmizi vb.) hadis-i şerif araması.
   - **Diyanet İlmihali & Fıkıh Motoru**: İman, Temizlik, Abdest, Namaz, Oruç, Zekat, Hac, Kurban, Nikah ve Güncel Fetvalar.

2. **Şeffaf Tool Calling (Araç Çağrı) İzleme**:
   - Model, kullanıcının karmaşık sorularını çözerken arka planda attığı `[Turn 1]` ve `[Turn 2]` araç çağrılarını, parametrelerini ve JSON çıktılarını canlı olarak **`🔍 Arka Plan Araç Çağrı İzleme`** panelinde sergiler.

3. **Gelişmiş Etkileşimli Özellikler**:
   - **🔊 Sesli Okuma (Text-to-Speech)**: Yanıtları duru bir Türkçe ile seslendirme.
   - **⏳ Canlı Ezan Geri Sayımı**: Bir sonraki ezan vaktine kalan süreyi saniye saniye canlı sayan widget.
   - **📋 Kopyala & ⭐ Favorilere Ekle**: Yanıtları panoya kopyalama ve tarayıcı hafızasına (`localStorage`) kaydetme.
   - **🗣️ Doğal Sohbet Dili Algılama**: Halk diliyle sorulan soruları ("Hocam sakız orucu bozar mı?") anlayan akıllı eşleştirme.

---

## 🛠️ Tanımlı Araçlar (Tool Schemas)

- `get_prayer_times(location, country, date)`: Şehir ve ilçelere özel ezan vakitlerini çeker.
- `convert_gregorian_to_hijri(date)`: Miladi tarihi Hicri takvime dönüştürür.
- `search_quran_verse(query)`: Kur'an ayeti ve Diyanet mealini getirir.
- `search_hadith(query)`: Sahih Hadis-i Şerif ve kaynağını getirir.
- `search_ilmihal_fiqh(query)`: Diyanet İlmihali fıkıh konularını getirir.
- `calculate_time_difference(time1, time2)`: Saatler arası kalan süreyi hesaplar.

---

## 📂 Proje Dosya Yapısı

- `index.html`: Ana arayüz, sohbet paneli ve canlı Tool Trace Log ekranı.
- `style.css`: Modern glassmorphic karanlık tema stilleri.
- `app.js`: Multi-Turn Tool Calling Engine (Aladhan, AlQuran Cloud, İlmihal, TTS, Geri Sayım).
- `README.md`: Hugging Face Space ve GitHub tanıtım dokümanı.

---

## 🚀 Canlı Demo ve Yayın

- **Hugging Face Space**: [Aysenur44/ezan-vakti-ai-assistant](https://huggingface.co/spaces/Aysenur44/ezan-vakti-ai-assistant)
- **GitHub Deposu**: [Aysenuryesilova/ezan-vakti](https://github.com/Aysenuryesilova/ezan-vakti)
