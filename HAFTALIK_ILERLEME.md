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
| 8 | 08.06 - 14.06 | Süreç görselleştirme ve dashboard altyapısının geliştirilmesi | %80 | 🔄 Devam Ediyor |
| 9 | 15.06 - 21.06 | Kullanıcı arayüzü geliştirme , backend ile entegrasyonu, bitirme sunum ve poster hazırlıkları | %90 | ⬜ Başlamadı |
| 10 | 22.06 - 28.06 | Test, hata düzeltme, performans iyileştirme ve proje dokümantasyonunun tamamlanması | %100 | ⬜ Başlamadı |

**Durum simgeleri:** ⬜ Başlamadı | 🔄 Devam Ediyor | ✅ Tamamlandı | ⚠️ Gecikti

---

## Haftalık İlerleme Kayıtları

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

