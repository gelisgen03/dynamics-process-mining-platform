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

> **Kullanım:** Dönem başında aşağıdaki tabloyu projenize göre doldurun. Her hafta için planlanan işi ve o haftanın sonunda projenin tahmini tamamlanma oranını yazın. Dönem ilerledikçe "Durum" sütununu güncelleyin.

| Hafta | Tarih Aralığı | Planlanan İş | Tahmini Tamamlanma (%) | Durum |
|-------|---------------|--------------|------------------------|-------|
| 1 | 06.04 - 12.04 | Proje gereksinimlerinin belirlenmesi, süreç madenciliği kavramlarının araştırılması ve sistem mimarisinin tasarlanması| %10 | ✅ Tamamlandı |
| 2 | 13.04 - 19.04 | Python ortamının kurulması, FastAPI projesinin oluşturulması ve temel backend yapısının hazırlanması ve Ara Rapor Formu Doldurulması | %20 | ✅ Tamamlandı |
| 3 | 27.04 - 03.05 | Microsoft Dynamics 365 veri yapısının incelenmesi ve örnek event log veri modelinin oluşturulması | %30 | 🔄 Devam Ediyor |
| 4 | 04.05 - 10.05 | Dynamics 365’ten veri çekme simülasyonu ve veri ön işleme modülünün geliştirilmesi | %40 | ⬜ Başlamadı |
| 5 | 11.05 - 17.05 | pm4py kütüphanesi kullanılarak temel süreç keşfi (process discovery) modülünün geliştirilmesi | %50 | ⬜ Başlamadı |
| 6 | 18.05 - 24.05 | Farklı süreç keşfi algoritmalarının uygulanması ve model karşılaştırma altyapısının kurulması | %60 | ⬜ Başlamadı |
| 7 | 01.06 - 07.06 | Uyumluluk analizi (conformance checking) ve performans analiz modüllerinin geliştirilmesi | %70 | ⬜ Başlamadı |
| 8 | 08.06 - 14.06 | Süreç görselleştirme ve dashboard altyapısının geliştirilmesi | %80 | ⬜ Başlamadı |
| 9 | 15.06 - 21.06 | Kullanıcı arayüzü geliştirme , backend ile entegrasyonu, bitirme sunum ve poster hazırlıkları | %90 | ⬜ Başlamadı |
| 10 | 22.06 - 28.06 | Test, hata düzeltme, performans iyileştirme ve proje dokümantasyonunun tamamlanması | %100 | ⬜ Başlamadı |

**Durum simgeleri:** ⬜ Başlamadı | 🔄 Devam Ediyor | ✅ Tamamlandı | ⚠️ Gecikti

---

## Haftalık İlerleme Kayıtları

> **Kullanım:** Her hafta aşağıdaki şablonu kopyalayıp doldurun. En güncel hafta en üstte olacak şekilde ekleyin.


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

### Hafta 1 *(Tarih: GG.AA.YYYY - GG.AA.YYYY)*

**Plandaki hedef:**
- *(İş planındaki o haftaya ait maddeyi buraya yazın)*

**Bu hafta yaptıklarım:**
- *(Yaptığınız işleri madde madde yazın)*

**Plana göre durumum:**
- *(Plandaki hedefe ulaştınız mı? Gerideyseniz nedenini açıklayın)*

**Karşılaştığım sorunlar / zorluklar:**
- *(Varsa karşılaştığınız teknik veya diğer sorunları yazın. Yoksa "Yok" yazın)*

**Gelecek hafta hedefim:**
- *(Bir sonraki hafta yapmayı planladığınız işleri yazın)*

---

<!--
ŞABLON: Yeni hafta eklemek için aşağıdaki bloğu kopyalayıp üste yapıştırın.

### Hafta X *(Tarih: GG.AA.YYYY - GG.AA.YYYY)*

**Plandaki hedef:**
- 

**Bu hafta yaptıklarım:**
- 

**Plana göre durumum:**
- 

**Karşılaştığım sorunlar / zorluklar:**
- 

**Gelecek hafta hedefim:**
- 

---
-->
