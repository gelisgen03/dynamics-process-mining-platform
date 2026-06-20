"""
D365 Finance - Satın Alma Süreci Olay Günlüğü Üretici
Çıktı: d365_event_log.csv  (case_id int, activity text, timestamp ISO text)
"""

import csv
import random
from datetime import datetime, timedelta, timezone

random.seed(42)

# ── Süreç varyantları ──────────────────────────────────────────────────────────

HAPPY_PATH = [
    ("Satın Alma Talebi Oluşturuldu",   (1,  4)),   # (min_saat, max_saat sonra)
    ("Talep Onaya Gönderildi",           (2,  8)),
    ("Talep Onaylandı",                  (4, 24)),
    ("Satın Alma Siparişi Oluşturuldu",  (1,  6)),
    ("Tedarikçiye Gönderildi",           (2, 12)),
    ("Tedarikçi Onayladı",               (24, 72)),
    ("Mal/Hizmet Alındı",                (48, 168)),
    ("Fatura Alındı",                    (2, 24)),
    ("Ödeme Yapıldı",                    (24, 72)),
]

REJECTION_PATH = [
    ("Satın Alma Talebi Oluşturuldu",   (1,  4)),
    ("Talep Onaya Gönderildi",           (2,  8)),
    ("Talep Reddedildi",                 (4, 24)),
    ("Talep Güncellendi",                (4, 16)),
    ("Talep Onaya Gönderildi",           (1,  4)),
    ("Talep Onaylandı",                  (4, 24)),
    ("Satın Alma Siparişi Oluşturuldu",  (1,  6)),
    ("Tedarikçiye Gönderildi",           (2, 12)),
    ("Tedarikçi Onayladı",               (24, 72)),
    ("Mal/Hizmet Alındı",                (48, 168)),
    ("Fatura Alındı",                    (2, 24)),
    ("Ödeme Yapıldı",                    (24, 72)),
]

PARTIAL_DELIVERY_PATH = [
    ("Satın Alma Talebi Oluşturuldu",   (1,  4)),
    ("Talep Onaya Gönderildi",           (2,  8)),
    ("Talep Onaylandı",                  (4, 24)),
    ("Satın Alma Siparişi Oluşturuldu",  (1,  6)),
    ("Tedarikçiye Gönderildi",           (2, 12)),
    ("Tedarikçi Onayladı",               (24, 72)),
    ("Kısmi Teslimat Alındı",            (48, 120)),
    ("İkinci Teslimat Alındı",           (24, 96)),
    ("Fatura Alındı",                    (2, 24)),
    ("Ödeme Yapıldı",                    (24, 72)),
]

INVOICE_DISPUTE_PATH = [
    ("Satın Alma Talebi Oluşturuldu",   (1,  4)),
    ("Talep Onaya Gönderildi",           (2,  8)),
    ("Talep Onaylandı",                  (4, 24)),
    ("Satın Alma Siparişi Oluşturuldu",  (1,  6)),
    ("Tedarikçiye Gönderildi",           (2, 12)),
    ("Tedarikçi Onayladı",               (24, 72)),
    ("Mal/Hizmet Alındı",                (48, 168)),
    ("Fatura Alındı",                    (2, 24)),
    ("Fatura Uyuşmazlığı",               (4, 16)),
    ("Fatura Düzeltildi",                (24, 72)),
    ("Ödeme Yapıldı",                    (24, 48)),
]

# Varyant dağılımı: 60 / 15 / 15 / 10
VARIANTS = (
    [HAPPY_PATH] * 60 +
    [REJECTION_PATH] * 15 +
    [PARTIAL_DELIVERY_PATH] * 15 +
    [INVOICE_DISPUTE_PATH] * 10
)
random.shuffle(VARIANTS)

# ── CSV üret ──────────────────────────────────────────────────────────────────

START_DATE = datetime(2024, 1, 2, tzinfo=timezone.utc)
END_DATE   = datetime(2025, 3, 31, tzinfo=timezone.utc)

rows = []
for case_id, variant in enumerate(VARIANTS, start=1):
    # Her vaka farklı bir başlangıç zamanında başlasın
    span_seconds = int((END_DATE - START_DATE).total_seconds())
    case_start = START_DATE + timedelta(seconds=random.randint(0, span_seconds - 30 * 86400))

    current_time = case_start
    for activity, (min_h, max_h) in variant:
        rows.append({
            "case_id":   case_id,
            "activity":  activity,
            "timestamp": current_time.strftime("%Y-%m-%dT%H:%M:%S+00:00"),
        })
        delta_hours = random.uniform(min_h, max_h)
        current_time += timedelta(hours=delta_hours)

# Zaman sırasına göre sırala (tüm vakalar karışık)
rows.sort(key=lambda r: (r["case_id"], r["timestamp"]))

out_path = "d365_event_log.csv"
with open(out_path, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=["case_id", "activity", "timestamp"])
    writer.writeheader()
    writer.writerows(rows)

print(f"Üretildi: {out_path}")
print(f"Toplam satır : {len(rows)}")
print(f"Vaka sayısı  : {len(VARIANTS)}")
print(f"Varyant dağılımı:")
print(f"  Mutlu yol         : 60 vaka")
print(f"  Reddedildi        : 15 vaka")
print(f"  Kısmi teslimat    : 15 vaka")
print(f"  Fatura uyuşmazlığı: 10 vaka")
