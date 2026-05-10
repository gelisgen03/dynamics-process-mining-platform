from supabase import create_client, Client
import os
from dotenv import load_dotenv

# .env dosyasındaki değişkenleri yükle
load_dotenv() 

# --- Supabase Proje Bilgileri ---
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

# --- Supabase Client'ını Başlatma ---
supabase: Client | None = None
if not SUPABASE_URL or not SUPABASE_KEY:
    print("Supabase URL veya Key bulunamadı. Lütfen .env dosyanızı kontrol edin.")
else:
    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("Supabase bağlantısı başarıyla kuruldu.")
    except Exception as e:
        print(f"Supabase bağlantı hatası: {e}")

# --- Veri Erişim Fonksiyonları ---
def get_all_logs():
    if supabase:
        return supabase.table('event_log_data').select("*").execute()
    return {"data": [], "error": "Supabase client not initialized"}

