import os
import pandas as pd
import pm4py
from dbconnect import get_logs

# Görsellerin kaydedileceği dizini oluştur
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "outputs")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Graphviz yolunu ekleyelim
os.environ["PATH"] += os.pathsep + r"C:\Program Files\Graphviz\bin"

def preprocess(df):
    """
    Supabase'den çekilen raw veriyi temizler, timestamp formatını düzeltir ve
    olay sıralamasına göre sıralar.
    """
    df = df.copy()
    # Timestamp sütununu utc aware olarak tarih/zaman türüne çevir
    df['timestamp'] = pd.to_datetime(df['timestamp'], utc=True, errors='coerce')
    
    # Gerekli sütunlarda eksik (NaN) olan satırları at
    df = df.dropna(subset=['case_id', 'activity', 'timestamp'])
    
    # Vaka(case_id) değerlerine ve zamana göre kronolojik olarak sırala
    df.sort_values(by=['case_id', 'timestamp'], inplace=True)
    return df

def to_pm4py_log(df, case_id_col='case_id', activity_col='activity', timestamp_col='timestamp'):
    """
    Temizlenen Pandas DataFrame'ini PM4Py Event Log yapısına çevirir.
    """
    # Kolon isimlerini PM4Py'nin anlayacağı formata (örn: case:concept:name, concept:name, time:timestamp) eşle
    df = pm4py.format_dataframe(df, case_id=case_id_col, activity_key=activity_col, timestamp_key=timestamp_col)
    
    # PM4Py Event Log objesine dönüştür
    return pm4py.convert_to_event_log(df)

def discover_and_save(log, algorithm="inductive", name="analysis"):
    """
    Oluşturulan Event Log üzerinde süreç keşfi (discovery) algoritmasını uygular ve
    sonucu bir görsel olarak (.png) kaydeder.
    """
    try:
        if algorithm == "alpha":
            net, im, fm = pm4py.discover_petri_net_alpha(log)
        else:
            net, im, fm = pm4py.discover_petri_net_inductive(log)

        out_path = os.path.join(OUTPUT_DIR, f"{name}_{algorithm}.png")
        pm4py.save_vis_petri_net(net, im, fm, out_path)
        return out_path

    except Exception as e:
        print(f"Discovery error: {e}")
        return None

def run_data_processing_test(limit: int = 1000, offset: int = 0):
    """
    Tüm test akışını (çek -> temizle -> pm4py log'a çevir -> süreç keşfet) yürütür.
    """
    print(f">>> Veri çekme ve PM4Py analiz testi başlatılıyor (Limit: {limit}, Offset: {offset})")
    
    # 1. Supabase'den logs'ları çek
    resp = get_logs(limit=limit, offset=offset)
    if resp is None:
        print("Supabase client başlatılmamış (dbconnect.py).")
        return
        
    data = resp.data if hasattr(resp, "data") else (resp.get("data") if isinstance(resp, dict) else resp)
    if not data:
        print("Çekilen veri yok veya boş döndü.")
        return

    # 2. DataFrame'e çevir ve bilgi ver
    df = pd.DataFrame(data)
    print(f"Çekilen kayıt (Raw): {len(df)}")
    
    # 3. Ön işleme yap (Zaman formatı düzeltme, boş olanları atma, sıralama)
    df = preprocess(df)
    print(f"Ön işlem sonrası temiz kayıt: {len(df)}")
    
    if len(df) == 0:
         print("Temizleme sonrası elimizde veri kalmadı. Test sonlandırılıyor.")
         return

    print("\n--- İlk 5 Satır (Temizlenmiş) ---")
    print(df.head())

    # 4. PM4Py Event Log dönüşümü
    try:
        print("\n>>> PM4Py dönüşümü ve Discovery başlatılıyor...")
        log = to_pm4py_log(df)
        
        # Inductive algortiması ile modeli keşfet ve sample_inductive.png olarak kaydet
        out_file = discover_and_save(log, algorithm='inductive', name='sample')
        
        if out_file:
            print(f">>> Süreç modeli (Petri Net) PNG olarak kaydedildi:\n    {out_file}")
            print("\n>>> Test ve PM4Py Analizi Başarılı!")
        else:
            print("Model oluşturulamadı (discover_and_save başarısız oldu).")
            
    except Exception as e:
        print(f"PM4Py işlem hatası: {e}")

if __name__ == "__main__":
    # Veri akışını biraz daha büyük limit ile test edelim ki discovery mantıklı bağlar bulsun
    run_data_processing_test(limit=500, offset=0)