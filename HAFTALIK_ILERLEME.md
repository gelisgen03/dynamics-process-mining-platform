# Bitirme Projesi Haftalık İlerleme Raporu

## Proje Bilgileri

| Alan | Bilgi |
|------|-------|
| **Öğrenci Adı Soyadı** | Süleyman Asım Gelişgen |
| **Öğrenci No** | 21360859086 |
| **Proje Başlığı** | Microsoft Dynamics 365 Entegrasyonlu Süreç Madenciliği Tabanlı İş Süreci Analiz Platformu |
| **Danışman** | Prof. Dr. Turgay Tugay Bilgin |
| **Dönem** | 2025-2026 Bahar |

---

## İş Planı

| Hafta | Tarih Aralığı | Planlanan İş | Tahmini Tamamlanma (%) | Durum |
|-------|---------------|--------------|------------------------|-------|
| 1 | 06.04 - 12.04 | Proje gereksinimlerinin belirlenmesi, süreç madenciliği kavramlarının araştırılması ve sistem mimarisinin tasarlanması| %10 | ✅ Tamamlandı |
| 2 | 13.04 - 19.04 | Python ortamının kurulması, FastAPI projesinin oluşturulması ve temel backend yapısının hazırlanması ve Ara Rapor Formu Doldurulması | %20 | ✅ Tamamlandı |
| 3 | 27.04 - 03.05 | Microsoft Dynamics 365 veri yapısının incelenmesi ve örnek event log veri modelinin oluşturulması | %30 | ✅ Tamamlandı |
| 4 | 04.05 - 10.05 | Dynamics 365’ten veri çekme simülasyonu ve veri ön işleme modülünün geliştirilmesi | %40 | ✅ Tamamlandı |
| 5 | 11.05 - 17.05 | pm4py kütüphanesi kullanılarak temel süreç keşfi (process discovery) modülünün geliştirilmesi | %50 | ✅ Tamamlandı |
| 6 | 18.05 - 24.05 | Farklı süreç keşfi algoritmalarının uygulanması ve model karşılaştırma altyapısının kurulması | %60 | ✅ Tamamlandı |
| 7 | 01.06 - 07.06 | Uyumluluk analizi (conformance checking) ve performans analiz modüllerinin geliştirilmesi | %70 | ✅ Tamamlandı |
| 8 | 08.06 - 14.06 | Süreç görselleştirme ve dashboard altyapısının geliştirilmesi | %80 | ✅ Tamamlandı |
| 9 | 15.06 - 21.06 | Kullanıcı arayüzü geliştirme, backend ile entegrasyonu, bitirme sunum ve poster hazırlıkları | %90 | ✅ Tamamlandı |
| 10 | 22.06 - 28.06 | Test, hata düzeltme, performans iyileştirme ve proje dokümantasyonunun tamamlanması | %100 | 🔄 Devam Ediyor |

**Durum simgeleri:** ⬜ Başlamadı | 🔄 Devam Ediyor | ✅ Tamamlandı | ⚠️ Gecikti

---

## Haftalık İlerleme Kayıtları

---

### Hafta 10 *(Tarih: 22.06.2026 - 28.06.2026)*

**Plandaki hedef:**
- Test, hata düzeltme, performans iyileştirme ve proje dokümantasyonunun tamamlanması.

**Bu hafta yaptıklarım:**
- Tüm sekmelerin son kullanıcı testleri yapıldı; bulunan hatalar giderildi.
- Analiz sonuçları korunarak sekme geçişi sağlandı (lazy-mount / `display:none` stratejisi): sekme değişimlerinde React bileşeni unmount edilmeden gizleniyor, geri dönüldüğünde önceki sonuçlar bozulmadan görüntüleniyor.
- Performans sekmesi bölüm sıralaması kullanıcı deneyimine göre yeniden düzenlendi: KPI kartları → En Yavaş/Hızlı → Darboğaz Analizi → Süre Dağılımı.
- Ana sayfa "Nasıl Çalışır?" bölümü kaldırılarak sayfa sade tutuldu.
- Tüm analiz sekmelerinde varsayılan case limit 500'den **100**'e indirildi; varsayılan veri kaynağı **Dynamics 365 Dummy Data** olarak ayarlandı.
- Veri Kümesi sekmesindeki özet istatistikler statik kaynaktan okunacak şekilde yeniden düzenlendi (BPI 2012: 262.200 event / 13.087 case; D365: 980 event / 100 case); API çağrısı ortadan kaldırıldı.
- Haftalık ilerleme raporu (HAFTALIK_ILERLEME.md) 8.-9.-10. hafta kayıtlarıyla güncellendi.

**Plana göre durumum:**
- 10. hafta hedefleri büyük ölçüde tamamlandı. Platform kararlı çalışır durumda, tüm analiz sekmeleri hatasız çalışmaktadır.

**Karşılaştığım sorunlar / zorluklar:**
- Sekme değişiminde bileşen unmount olduğundan analiz sonuçları kayboluyordu. Tüm tab'ları aynı anda DOM'da tutup `display:none`/`display:contents` ile görünürlüğü yönetmek yerine, "lazy-mount" yaklaşımıyla ilk ziyarette mount edilip asla unmount edilmeme stratejisi uygulandı.
- Veri özeti API çağrısı büyük tablolarda (BPI 2012 – 262.200 satır) sonsuz pagination döngüsüne girerek "Yükleniyor…" ekranında takılıyordu; statik veri yaklaşımıyla hem doğruluk hem anlık yükleme sağlandı.

**Gelecek hafta hedefim:**
- Bitirme tezi yazımının tamamlanması.
- Sunum materyallerinin ve posterinin son halinin hazırlanması.

---

### Hafta 9 *(Tarih: 15.06.2026 - 21.06.2026)*

**Plandaki hedef:**
- Kullanıcı arayüzü geliştirme, backend ile entegrasyon, bitirme sunum ve poster hazırlıkları.

**Bu hafta yaptıklarım:**

**Çoklu Veri Seti Altyapısı:**
- Platform BPI 2012'ye özgü yapıdan kurtarılarak genel amaçlı hale getirildi. Her backend endpoint'e `table_name` parametresi eklendi (GET sorguları query param, POST sorguları request body üzerinden).
- `dbconnect.py`'de `DEFAULT_TABLE = "event_log_data"` sabiti tanımlandı; `get_logs()` ve `get_all_logs()` fonksiyonları parametrik hale getirildi.
- `outcome_filter` (A_ACCEPTED / A_DECLINED) yalnızca BPI 2012 tablosunda çalışacak şekilde koşullandırıldı.

**Dynamics 365 Dummy Data Veri Seti:**
- Gerçekçi D365 Finance satın alma süreci simüle eden `generate_d365_data.py` betiği yazıldı: 4 proses varyantı (Happy Path %60, Rejection %15, Partial Delivery %15, Invoice Dispute %10), 100 case, 980 event, 2024-2025 tarih aralığı.
- `d365_event_log` tablosu Supabase'de oluşturuldu (`id int8, case_id int8, activity text, timestamp text`) ve veriler yüklendi.

**Frontend Veri Kaynağı Yönetimi:**
- `DataSourceContext.jsx` React Context API bileşeni oluşturuldu; `tableName`, `source`, `sources`, `setTableName` global state olarak tüm sekmelere dağıtıldı.
- Dashboard header'a kaynak seçici dropdown eklendi: `BPI` / `D365` badge'i ve `<select>` ile anlık veri kaynağı değiştirme imkânı.
- `client.js`'deki tüm API metodlarına `tableName` parametresi eklendi.
- `CaseSelector` bileşeninde outcome filter D365 veri setinde otomatik gizlendi (`isBpi` koşulu).
- `ComparisonTab`, `DiscoveryTab`, `VariantTab`, `PerformanceTab`, `ConformanceTab`, `CaseInspectTab`, `SettingsTab` bileşenlerine `useDataSource()` entegrasyonu yapıldı.

**Case İncele Sekmesi D365 Desteği:**
- `/api/case-detail` endpoint'i `table_name` parametresini görmezden geliyordu; `get_logs()` çağrısına `table_name` aktarılarak D365 verisinde de case arama yapılabilmesi sağlandı.

**Petri Net Görselleştirme İyileştirmeleri:**
- Yeni Petri net çizimi yapıldığında eski görsel gösterilmeye devam ediyordu. `/api/petri-image/{filename}` endpoint'i `Cache-Control: no-store` başlığıyla eklendi; `<img key={result.timestamp}>` ile React DOM elementi her sorguda yeniden oluşturuldu.
- Petri net görseli altına 6 öğeli sembol açıklama kartı (legend) eklendi: Yer, Token, Geçiş, Sessiz Geçiş (τ), Ark, Başlangıç→Bitiş.

**AI Chat Widget Yeniden Tasarımı:**
- Context panel ve kafa karıştırıcı butonlar kaldırıldı. Temizle (çöp kutusu) ve Kapat (✕) butonları net şekilde ayrıştırıldı.
- Chat widget subtitle'ı seçili veri kaynağı adını dinamik olarak gösteriyor (`Gemini · Dynamics 365 Dummy Data`).

**Ana Sayfa Yeniden Tasarımı:**
- HomeTab karmaşık navigasyon hub'ından temiz bir karşılama ekranına dönüştürüldü: hero bölümü + iki yol kartı (Supabase analizi / Canlı D365 telemetrisi).
- `public/bachraund_brand.png` hero arka planı olarak uygulandı (koyu mavi gradient katmanı ile birlikte).
- Sidebar sıralaması mantıksal akışa göre düzenlendi: Karşılaştır → Keşfet.

**Plana göre durumum:**
- 9. hafta hedefleri tamamlandı. Platform artık iki farklı veri kümesiyle (BPI 2012 ve D365 Dummy Data) çalışabilmekte; kullanıcı arayüzü önemli ölçüde iyileştirilmiştir.

**Karşılaştığım sorunlar / zorluklar:**
- D365 tablosunda `timestamp` alanı `text` tipinde saklandığından pm4py timestamp parse işlemi için `pd.to_datetime(..., utc=True, errors='coerce')` kullanıldı; UTC+00:00 format dönüşümü sorunsuz çalıştı.
- BPI 2012 veri özeti endpoint'i 10.000 satır sınırında kesildiğinden yanlış case sayısı (37 case) döndürüyordu. Gerçek istatistikler `DataSourceContext`'e sabit olarak tanımlandı.

**Gelecek hafta hedefim:**
- Final testleri ve belgeleme.
- Bitirme sunumu ve poster hazırlıklarının tamamlanması.

---

### Hafta 8 *(Tarih: 08.06.2026 - 14.06.2026)*

**Plandaki hedef:**
- Süreç görselleştirme ve dashboard altyapısının geliştirilmesi.

**Bu hafta yaptıklarım:**

**Varyant Analizi — Accordion Görünümü:**
- Her trace varyantı tıklanabilir accordion kartı olarak yeniden tasarlandı. Açıldığında o varyantın adım adım aktivite akışı gösteriliyor, kapatılabiliyor. Renk kodlaması: A_ mavi, O_ yeşil, W_ kırmızı.
- Top 10 varyant ve top 15 aktivite frekans grafiği görselleştirildi.

**Case İncele Sekmesi:**
- Case ID girildiğinde o case'e ait adım adım timeline, her adım için bekleme süresi, dataset ortalamasıyla karşılaştırma ve outcome (Kabul/Red/Tamamlandı) bilgisi gösteriliyor.
- En uzun bekleme yaratan adım ⚠ uyarı işaretiyle vurgulanıyor.
- Backend'e `/api/case-detail` endpoint'i eklendi: token hesabı, adım dizisi, en uzun bekleme, yüzdelik dilim hesabı döndürüyor.

**AI Chat Widget (Gemini Entegrasyonu):**
- Sağ alt köşede sabit konumlu AI asistan butonu eklendi.
- Google Gemini API (`gemini-2.5-flash`) ile sohbet desteği kuruldu; backend `/api/chat` endpoint'i üzerinden çalışıyor.
- Sohbet geçmişi (multi-turn) destekleniyor; analiz bağlamı metin olarak eklenebiliyor.
- Hızlı soru önerileri (suggestion chip) ile kullanıcı yönlendirmesi yapıldı.
- Sistem prompt'u süreç madenciliği odaklı, emoji destekli kısa-madde formatında Türkçe yanıt verecek şekilde yapılandırıldı.

**Dashboard ve Performans İyileştirmeleri:**
- "Platform Hakkında" sekmesi kaldırıldı; yerini daha işlevsel sekmelere bıraktı.
- Sidebar ve header görseli iyileştirildi.
- Tez yazımı için ekran görüntüleri ve sonuç verileri toplandı.

**Plana göre durumum:**
- 8. hafta hedefleri tamamlandı. Dashboard'a case inceleme ve yapay zeka asistan özellikleri eklenerek platform işlevselliği önemli ölçüde artırıldı.

**Karşılaştığım sorunlar / zorluklar:**
- Gemini API modellerinde sürüm uyumsuzlukları yaşandı (`NOT_FOUND` hataları). Backend'de `gemini-2.5-flash-preview` → `gemini-2.5-flash` → `gemini-1.5-flash` → `gemini-1.5-pro` sırasıyla fallback deneyen bir döngü yazılarak kararlı çalışma sağlandı.
- pm4py token-based replay büyük log'larda uzun sürebiliyordu; case limit parametresiyle kontrol altına alındı.

**Gelecek hafta hedefim:**
- Platformu BPI 2012 bağımlılığından kurtararak farklı veri kümeleriyle çalışabilir hale getirmek.
- D365 Finance satın alma süreci için gerçekçi dummy veri seti oluşturmak ve Supabase'e yüklemek.
- Frontend'e dinamik veri kaynağı seçici eklemek.

---

### Hafta 7 *(Tarih: 01.06.2026 - 07.06.2026)*

**Plandaki hedef:**
- Uyumluluk analizi (conformance checking) ve performans analiz modüllerinin geliştirilmesi.

**Bu hafta yaptıklarım:**
- **Conformance Checking (Uyumluluk Analizi):** Token-based replay ile her case için ayrı ayrı uyumluluk hesaplandı. `fit` / `partial` / `non_fit` sınıflandırması yapıldı, fitness dağılımı ve en sorunlu case'ler raporlandı.
- **Performans Analizi:** Case başına süre (ilk event → son event), case süresi dağılımı (bucket'lara göre), aktivite başına ortalama bekleme süresi (darboğaz tespiti), en yavaş/hızlı 5 case hesaplandı.
- **Varyant Analizi:** Her case'in aktivite dizisi çıkarıldı, benzersiz trace varyantları frekansa göre sıralandı, aktivite frekans analizi yapıldı.
- Backend'e 3 yeni endpoint eklendi: `/api/conformance`, `/api/performance`, `/api/variants`.
- Frontend'de 7 sekmenin tamamı hayata geçirildi:
  - **Veri Kümesi Özeti:** Aktivite ikonları ve süreç adımı kategorileri eklendi.
  - **Süreç Keşfi:** Heuristics Miner seçeneği, metrik kartları, Petri net görüntüleme.
  - **Algoritma Karşılaştırması:** 3 algoritma yan yana tablo ve metrik grafikleri.
  - **Varyant Analizi:** Top 10 trace ve top 15 aktivite frekans görselleştirmesi.
  - **Performans:** Case süre dağılımı, darboğaz grafiği, en yavaş/hızlı case tablosu.
  - **Uyumluluk Analizi:** Uyumluluk oranı, fitness dağılımı, sorunlu case tablosu.
  - **Sistem Ayarları:** Bağlantı durumu, metrik ağırlıkları, algoritma karşılaştırması, proje bilgileri.

**Plana göre durumum:**
- Hafta 7 hedefleri tamamlandı. Proje web arayuzunun çalışan ilk prototipi oluşturuldu. Bir sonraki hafta planına (8. hafta) sadık kalınarak web arayuzu iyileştirilmesi yapılacak.

**Karşılaştığım sorunlar / zorluklar:**
- Token-based replay, büyük log'larda uzun sürebiliyor. Limit parametresi ile kontrol altına alındı.

**Gelecek hafta hedefim:**
- Web arayuzu geliştirmeleri.
- Tüm sekmelerin entegrasyon testleri ve hata düzeltmeleri.
- Tez yazımı için ekran görüntüleri ve sonuç tabloları hazırlanması.
- Bitirme sunumu ve poster hazırlıklarına başlanması.

---

### Hafta 6 *(Tarih: 18.05.2026 - 24.05.2026)*

**Plandaki hedef:**
- Farklı süreç keşfi algoritmalarının uygulanması ve model karşılaştırma altyapısının kurulması.

**Bu hafta yaptıklarım:**
- Üç farklı process discovery algoritması tam olarak uygulandı: **Inductive Miner**, **Alpha Miner**, **Heuristics Miner**.
- Her algoritma için dört kalite metriği hesaplayan `model_metrics.py` modülü geliştirildi:
  - **Fitness** (token-based replay, pm4py): Modelin event log'u ne kadar kapsadığı
  - **Precision** (ETC token-based): Modelin gereksiz davranış üretip üretmediği
  - **Generalization** (generalization evaluator): Yeni trace'lere genellenebilirlik
  - **Simplicity** (node sayısı formülü): Modelin okunabilirliği
- Algoritmaları aynı log üzerinde karşılaştırıp sıralayan `comparison.py` modülü geliştirildi.
- Backend API'sine `/compare-models`, `/discover-process`, `/get-metrics` endpoint'leri eklendi.
- Supabase'in varsayılan 1000 satır limitini aşmak için `dbconnect.py`'de otomatik sayfalama (pagination) uygulandı.
- Petri net görselleştirmeleri PNG olarak kaydedildi: `petri_net_inductive.png`, `petri_net_alpha.png`, `petri_net_heuristics.png`.

**Algoritma Karşılaştırma Deney Sonuçları (BPI Challenge 2012 – Kredi Başvurusu Dataset):**

*Deney 1: 999 event / 37 case (Supabase sayfalama düzeltmesi öncesi)*

| Sıra | Algoritma | Genel Skor | Fitness | Precision | Generalization | Simplicity |
|------|-----------|-----------|---------|-----------|----------------|------------|
| 1 | Heuristics Miner | 58.94 | 0.978 | 0.281 | 0.727 | 0.0 |
| 2 | Inductive Miner | 57.05 | 1.000 | 0.136 | 0.818 | 0.0 |
| 3 | Alpha Miner | 48.56 | 0.645 | 0.097 | 0.799 | 0.625 |

*Deney 2: 4995 event / 224 case (Supabase pagination düzeltmesi sonrası)*

| Sıra | Algoritma | Genel Skor | Fitness | Precision | Generalization | Simplicity |
|------|-----------|-----------|---------|-----------|----------------|------------|
| 1 | Heuristics Miner | 64.15 | 0.972 | 0.359 | 0.726 | 0.0 |
| 2 | Inductive Miner | 60.17 | 1.000 | 0.128 | 0.817 | 0.0 |
| 3 | Alpha Miner | 46.64 | 0.537 | 0.032 | 0.853 | 0.713 |

**Metrik Ağırlıkları:** Fitness %40, Precision %30, Generalization %20, Simplicity %10

**Sonuç Yorumu:**
- **Heuristics Miner** her iki deneyde de birinci çıktı. Gürültülü gerçek dünya verilerinde (BPI 2012) beklenen davranış.
- **Inductive Miner** mükemmel fitness (1.0) garanti ediyor ancak precision değeri düşük — model çok geniş davranışlar üretiyor.
- **Alpha Miner** büyük ve karmaşık log'da fitness değeri düştü (0.645 → 0.537), gürültüye duyarlılığı onaylandı.
- Daha fazla case ile çalışıldığında (37 → 224) Heuristics precision'ı belirgin biçimde arttı (0.281 → 0.359), veri miktarının model kalitesine etkisi gözlemlendi.

**Plana göre durumum:**
- Bu haftanın tüm hedefleri tamamlandı. Üç algoritma uygulandı, karşılaştırma altyapısı kuruldu ve deneysel sonuçlar elde edildi.

**Karşılaştığım sorunlar / zorluklar:**
- `pm4py` modern sürümünde `token_replay.apply()` artık dict yerine liste döndürüyordu; `pm4py.fitness_token_based_replay()` API'sine geçilerek çözüldü.
- Alignment-based precision hesabı 24 dakika sürdü (362 varyant × 4 sn). ETC token-based precision (`pm4py.precision_token_based_replay`) ile saniyeler içinde sonuç alındı.
- Supabase varsayılan olarak istek başına maksimum 1000 satır döndürüyor. `dbconnect.py`'ye otomatik pagination eklenerek limit aşıldı.

**Gelecek hafta hedefim:**
- Frontend arayüzü geliştirme: AlgorithmSelector, ComparisonTable, MetricsChart, ProcessViewer bileşenleri.
- Backend sonuçlarını React dashboard'unda görselleştirme.

---

### Hafta 5 *(Tarih: 11.05.2026 - 17.05.2026)*

**Plandaki hedef:**
- pm4py kütüphanesi kullanılarak temel süreç keşfi (process discovery) modülünün geliştirilmesi.

**Bu hafta yaptıklarım:**
- Supabase veritabanından `event_log_data` tablosundaki veriler başarıyla çekildi ve `pandas` DataFrame'e dönüştürüldü.
- `pm4py` kütüphanesinin temel algoritmaları (Inductive Miner ve Alpha Miner) kullanılarak process discovery modülü geliştirildi.
- Çekilen event log verileri, gerekli formata (EventLog objesi) dönüştürülerek process model keşfi gerçekleştirildi.
- Keşfedilen süreç modeli (Petri net) görselleştirmek için `graphviz` ve `pm4py` modüllerinin visualization fonksiyonları entegre edildi.
- Process discovery sonuçları başarıyla görselleştirildi ve örnek çıktılar elde edildi.
- Veri güvenliği sorunu (Supabase credentials) `.env` dosyası ile çözdü ve `.gitignore` konfigürasyonu tamamlandı.
- Superbase ile backend , backend ile frontend arasında ki temel Api root ları oluşturuldu
- Frontend web arayüzünde bulunacak sekmeler belirlendi ve dashboard da ilk veriler gösterildi

**Plana göre durumum:**
- Bu haftanın hedefleri plana uygun şekilde başarıyla gerçekleştirilmiştir. Temel süreç keşfi modülü tam işlevsel bir şekilde uygulanmış ve test edilmiştir.

**Karşılaştığım sorunlar / zorluklar:**
- Event log verilerinin pm4py formatına dönüştürülmesi sırasında timestamp formatı uyumsuzlukları yaşandı. Bu sorun, tarih/saat dönüşüm fonksiyonları eklenerek çözüldü.
- GitHub push protection hatası alındı. Gizli anahtarları `.env` dosyasına taşıyarak ve Git cache'ini temizleyerek problem çözüldü.

**Gelecek hafta hedefim:**
- Farklı process discovery algoritmalarını (Heuristics Miner, Fuzzy Miner vb.) uygulamak.
- Algoritmaların karşılaştırması için model karşılaştırma metrikleri geliştirmek.
- Backend API'sine process discovery endpoint'leri eklemek.
- Tez Yazımına Başlamak

---

### Hafta 4 *(Tarih: 04.05.2026 - 10.05.2026)*

**Plandaki hedef:**
- Dynamics 365’ten veri çekme simülasyonu ve veri ön işleme modülünün geliştirilmesi.

**Bu hafta yaptıklarım:**
- Veri depolama için seçilen Supabase üzerinde yeni bir veritabanı projesi yapılandırıldı.
- Süreç madenciliği verilerini saklamak amacıyla `event_log_data` adında bir tablo oluşturuldu. Bu tablo `case_id`, `activity` ve `timestamp` gibi temel süreç madenciliği alanlarını içerecek şekilde tasarlandı.
- Örnek `case-based_business_process_event_log.csv` dosyasındaki verileri Supabase veritabanına toplu olarak yüklemek için `import_csv.py` adında bir Python betiği geliştirildi.
- Bu betik, `pandas` kütüphanesi ile CSV dosyasını okuyup `supabase-py` kütüphanesi aracılığıyla verileri veritabanına aktarmaktadır.
- Veri aktarım betiği başarıyla çalıştırılarak örnek log verileri bulut veritabanına yüklendi ve veri çekme simülasyonu tamamlandı.

**Plana göre durumum:**
- Bu haftanın hedefleri plana uygun şekilde başarıyla gerçekleştirilmiştir. Veri çekme simülasyonu, verilerin bir CSV dosyasından okunup bulut veritabanına aktarılmasıyla tamamlanmıştır. Veri ön işleme modülünün önemli bir adımı olan bu aktarım betiği de tamamlanmıştır.

**Karşılaştığım sorunlar / zorluklar:**
- Python betiğini çalıştırırken başlangıçta dosya yolları ile ilgili bazı küçük sorunlar yaşandı. Bu sorunlar, betikte mutlak dosya yolları kullanılarak ve betik doğru dizinden çalıştırılarak aşıldı.

**Gelecek hafta hedefim:**
- `pm4py` kütüphanesini kullanarak Supabase veritabanından çekilen verilerle temel bir süreç keşfi (process discovery) yapmak.
- Keşfedilen süreç modelini (örneğin Petri net) görselleştirecek bir modül geliştirmeye başlamak.

---

### Hafta 3 *(Tarih: 27.04.2026 - 03.05.2026)*

**Plandaki hedef:**
- Microsoft Dynamics 365 veri yapısının incelenmesi ve örnek event log veri modelinin oluşturulması.

**Bu hafta yaptıklarım:**
- Microsoft Dynamics 365'in potansiyel süreçlerini (örn: Satış Siparişi Akışı) analiz etmek için standart veri yapıları incelendi.
- Süreç madenciliği için gerekli olan temel alanları (`case_id`, `activity`, `timestamp`) içerecek şekilde `Pydantic` tabanlı bir event log veri modeli tasarlandı.
- Verilerin çekileceği bulut veritabanı (Supabase) ile bağlantıyı kuracak olan `dbconnect.py` modülü oluşturuldu ve konfigüre edildi.
- Veritabanından logları çekmek için `get_all_logs` adında bir fonksiyon prototipi geliştirildi.
- case-based-bussines adında örnek bir log dosyası bulundu ve danışmanla birliikte bunun üzerinden demo yapılması kararlaştırıldı.
- Bulut veri tabanı olarak supabase seçildi hesap oluşturldu ve temel bağlantı kurulumları projeye eklendi.

**Plana göre durumum:**
- Bu haftanın hedefleri plana uygun şekilde başarıyla gerçekleştirilmiştir. Veri modelleme ve veritabanı bağlantı altyapısı tamamlanmıştır.

**Karşılaştığım sorunlar / zorluklar:**
- Yok.

**Gelecek hafta hedefim:**
- Dynamics 365'ten veri çekme sürecini simüle etmek.
- `dbconnect.py` modülünü kullanarak Supabase'den çekilen verileri `pandas` DataFrame'e dönüştürecek bir veri ön işleme modülü geliştirmeye başlamak.
- Veri temizleme ve formatlama (tarih/saat dönüşümleri vb.) adımlarını uygulamak.

---

### Hafta 2 *(Tarih: 13.04.2026 - 19.04.2026)*

**Plandaki hedef:**
- Python ortamının kurulması, FastAPI projesinin oluşturulması ve temel backend yapısının hazırlanması ve Ara Rapor Formu Doldurulması.

**Bu hafta yaptıklarım:**
- venv sanal ortamı içerisine FastAPI, uvicorn, pm4py ve pandas gibi temel kütüphanelerin kurulumu tamamlandı.
- requirements.txt dosyası oluşturularak projenin backend bağımlılıkları listelendi.
- Projede test ve geliştirme amacıyla kullanılmak üzere case-based_business_process_event_log.csv adında örnek bir event log veri seti bulundu ve projeye eklendi.
- Ara Rapor Formu için gerekli bilgilerin derlenmesine başlandı.

**Plana göre durumum:**
- Bu haftanın hedefleri plana uygun şekilde başarıyla gerçekleştirilmiştir. Backend altyapısı çalışır duruma getirilmiştir.

**Karşılaştığım sorunlar / zorluklar:**
- yok

**Gelecek hafta hedefim:**
- Microsoft Dynamics 365'in ilgili veri yapısını (örneğin, "Sales Order" veya "Case Management" tabloları) incelemek.
- İncelenen yapıya uygun olarak, Pydantic kullanarak event log veri modelini (case_id, activity, timestamp vb. alanları içeren) oluşturmak.
- Projeye eklenen case-based_business_process_event_log.csv dosyasını bu modele göre işlemeye yönelik ilk adımları atmak.

---

### Hafta 1 (Tarih: 06.04.2026 - 12.04.2026)

**Plandaki hedef:**
- Proje gereksinimlerinin belirlenmesi, süreç madenciliği kavramlarının araştırılması ve sistem mimarisinin tasarlanması.

**Bu hafta yaptıklarım:**
- Süreç madenciliği temel kavramları, kullanım alanları ve pm4py kütüphanesi üzerine detaylı literatür araştırması yapıldı.
- Projenin ana gereksinimleri belirlendi: Backend için Python (FastAPI), frontend için ise React kullanılacak.
- Sistem mimarisi, birbirinden bağımsız çalışacak backend ve frontend servisleri olarak tasarlandı.
- Bu mimariye uygun olarak ana klasör yapısı (backend, frontend) oluşturuldu.
- Frontend projesi Vite kullanılarak oluşturuldu ve temel bağımlılıkları kuruldu.
- Backend için Python sanal ortamı (venv) hazırlanarak projenin altyapı kurulumuna başlandı.

**Plana göre durumum:**
- Bu haftanın hedefleri başarıyla tamamlanmıştır. Planın ilerisindeyim; sistem mimarisinin tasarlanmasının yanı sıra, 2. haftanın konusu olan Python ortamının kurulması ve temel proje yapılarının oluşturulması adımlarına da giriş yapılmıştır.

**Karşılaştığım sorunlar / zorluklar:**
- Yok.

**Gelecek hafta hedefim:**
- Backend için FastAPI ve pm4py gibi temel kütüphaneleri kurmak.
- Backend'de basit bir "Merhaba Dünya" API endpoint'i oluşturarak altyapıyı test etmek.
- requirements.txt dosyasını oluşturarak backend bağımlılıklarını yönetmek.
- Ara Rapor Formu için hazırlıklara başlamak.

---

