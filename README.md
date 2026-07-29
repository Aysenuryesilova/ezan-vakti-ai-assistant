---
title: Dini Ilimler Ve Ezan Vakti AI Asistani
emoji: 🕌
colorFrom: blue
colorTo: indigo
sdk: static
pinned: false
license: mit
---

# 🕌 Dini İlimler & Ezan Vakti AI Asistanı (Tool Calling / Function Calling)

Bu proje, açık veri kaynakları (Public APIs) ve istemci tarafı (Client-Side) Multi-Turn Tool Calling mimarisi kullanılarak geliştirilmiş, **Dini İlimler, Kur'an-ı Kerim Mealleri, Sahih Hadis-i Şerifler, Hicri Takvim ve Ezan/Namaz Vakitleri** asistanıdır.

## 🌟 Proje Özellikleri

1. **Çoklu Public API Entegrasyonu (Multi-API)**:
   - **Aladhan REST API**: Diyanet hesaplama yöntemiyle namaz vakitleri, Miladi-Hicri takvim dönüşümü.
   - **AlQuran Cloud REST API**: Kur'an-ı Kerim ayetleri, Arapça metinleri ve Diyanet Meali.
   - **Sahih Hadis Veritabanı Servisi**: Kütüb-i Sitte (Buhari, Müslim vb.) hadis araması ve kaynak referansı.
   - **Dini Günler & Takvim Servisi**: Kandiller, Ramazan ve Bayram günleri.

2. **Şeffaf Tool Calling (Araç Çağrı) İzleme**:
   - Model, kullanıcının karmaşık sorularını çözerken arka planda attığı `[Turn 1]` ve `[Turn 2]` araç çağrılarını, parametrelerini ve JSON çıktılarını canlı olarak **Ödev Modu** panelinde sergiler.

3. **Kaynak Gösterimli Yanıtlar (Citation System)**:
   - Üretilen her yanıtın altında ilgili ayetin Sûre/Ayet numarası `[Mâide Sûresi, 6. Ayet]` ve hadis kaynakları `[Sahih-i Buhârî, Bed'ül-Vahy 1]` dipnot olarak sunulur.

4. **100% Ücretsiz ve Kesintisiz Yayın (Static SDK)**:
   - Hugging Face Spaces üzerinde Pro abonelik veya sunucu maliyeti gerektirmeyen, anında yüklenen `Static` SDK mimarisi.

---

## 🛠️ Tanımlı Araçlar (Tool Definitions)

- `get_prayer_times(location, country, date)`: Ezan vakitlerini çeker.
- `convert_gregorian_to_hijri(date)`: Hicri takvime dönüştürür.
- `search_quran_verse(query)`: Kur'an ayeti ve Diyanet mealini getirir.
- `search_hadith(query)`: Sahih Hadis-i Şerif ve kaynağını getirir.
- `get_religious_days(year)`: Dini günleri listeler.
- `calculate_time_difference(time1, time2)`: Saatler arası kalan süreyi hesaplar.
