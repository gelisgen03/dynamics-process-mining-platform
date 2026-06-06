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

SUPABASE_PAGE_LIMIT = 1000  # Supabase per-request hard cap

def get_logs(limit: int = 100, offset: int = 0):
    """Supabase'den veri çeker. limit>1000 ise otomatik sayfalama yapar."""
    if not supabase:
        return {"data": [], "error": "Supabase client not initialized"}

    if limit <= SUPABASE_PAGE_LIMIT:
        try:
            response = supabase.table('event_log_data').select("*").limit(limit).offset(offset).execute()
            return response
        except Exception as e:
            return {"data": [], "error": str(e)}

    # limit > 1000: batch batch çek, birleştir
    all_data = []
    current_offset = offset
    remaining = limit

    while remaining > 0:
        batch_size = min(remaining, SUPABASE_PAGE_LIMIT)
        try:
            response = supabase.table('event_log_data').select("*").limit(batch_size).offset(current_offset).execute()
            batch = response.data if hasattr(response, 'data') else []
            if not batch:
                break
            all_data.extend(batch)
            current_offset += len(batch)
            remaining -= len(batch)
            if len(batch) < batch_size:
                break
        except Exception as e:
            return {"data": all_data, "error": str(e)}

    class PaginatedResponse:
        def __init__(self, data):
            self.data = data
            self.error = None

    return PaginatedResponse(all_data)


