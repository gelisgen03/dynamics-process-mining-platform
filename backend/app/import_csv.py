import pandas as pd
from dbconnect import supabase
import os

def import_csv_to_supabase(file_path):
    """CSV verilerini Supabase'e aktarır."""
    if not supabase:
        print("Supabase bağlantısı kurulamadı. dbconnect.py dosyasını kontrol edin.")
        return

    try:
        # CSV dosyasını oku ve sütun adlarını düzenle
        df = pd.read_csv(file_path)
        df.rename(columns={
            'Case ID': 'case_id',
            'Activity': 'activity',
            'Timestamp': 'timestamp'
        }, inplace=True)

        # Verileri Supabase'e gönder
        data_to_insert = df.to_dict(orient='records')
        response = supabase.table('event_log_data').insert(data_to_insert).execute()

        # Sonucu kontrol et
        if len(getattr(response, 'data', [])) > 0:
            print(f"Başarıyla {len(response.data)} satır veritabanına eklendi.")
        else:
            print("Veri eklenirken bir sorun oluştu veya eklenecek veri bulunamadı.")
            # Olası bir hata mesajını görmek için yanıtı yazdırabilirsiniz
            # print("Supabase yanıtı:", response)

    except FileNotFoundError:
        print(f"Hata: '{file_path}' dosyası bulunamadı. Yolu kontrol edin.")
    except Exception as e:
        print(f"Beklenmedik bir hata oluştu: {e}")

if __name__ == "__main__":
    # CSV dosyasının tam (mutlak) yolu
    # Windows'ta ters taksim (\) karakteri sorun yaratabileceğinden normal taksim (/) kullanmak daha güvenlidir.
    csv_file_path = r'C:\Users\gelis\Documents\GitHub\dynamics-process-mining-platform\case-based_business_process_event_log.csv'
    
    print(f"'{os.path.basename(csv_file_path)}' dosyasındaki veriler Supabase'e aktarılıyor...")
    import_csv_to_supabase(csv_file_path)
