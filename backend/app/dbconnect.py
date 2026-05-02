from supabase import create_client, Client
import os

# --- Supabase Proje Bilgileri ---
SUPABASE_URL = "https_linkinizi_buraya_yapistirin"
SUPABASE_KEY = "anon_key_bilginizi_buraya_yapistirin"

# --- Supabase Client'ını Başlatma ---
supabase: Client | None = None
try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("Supabase bağlantısı başarıyla kuruldu.")
except Exception as e:
    print(f"Supabase bağlantı hatası: {e}")


# --- Veri Erişim Fonksiyonları ---
def get_all_logs():
        return []

