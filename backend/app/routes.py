from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse
from .dbconnect import get_logs, supabase, DEFAULT_TABLE
from .process_discovery import ProcessDiscovery
from .model_metrics import ModelMetrics
from .comparison import ProcessComparison
from . import appinsights
import pandas as pd
import pm4py
import os
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

router = APIRouter(prefix="/api", tags=["process-mining"])

# === OUTPUT DIRECTORY ===
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "outputs")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Graphviz yolunu ekle
os.environ["PATH"] += os.pathsep + r"C:\Program Files\Graphviz\bin"

# === CASE FILTER HELPER ===
def get_filtered_df(body: dict):
    """
    case_limit ve opsiyonel outcome_filter'a göre veri çekip filtreler.
    table_name body'den alınır; default event_log_data (BPI 2012).
    outcome_filter yalnızca BPI 2012 verisinde anlamlıdır.
    """
    case_limit  = int(body.get("case_limit", 500))
    table_name  = body.get("table_name", DEFAULT_TABLE)
    fetch_rows  = 50000

    response = get_logs(limit=fetch_rows, offset=0, table_name=table_name)
    if hasattr(response, "error") and response.error:
        raise HTTPException(status_code=400, detail=str(response.error))

    data = response.data if hasattr(response, "data") else response.get("data", [])
    if not data:
        raise HTTPException(status_code=400, detail="Veri bulunamadı")

    df = pd.DataFrame(data)
    df = preprocess(df)

    # outcome_filter yalnızca BPI 2012 tablosunda desteklenir
    if table_name == DEFAULT_TABLE:
        outcome_filter = body.get("outcome_filter", "all")
        if outcome_filter == "accepted":
            qualifying = set(df[df["activity"] == "A_ACCEPTED"]["case_id"])
            df = df[df["case_id"].isin(qualifying)]
        elif outcome_filter == "declined":
            qualifying = set(df[df["activity"] == "A_DECLINED"]["case_id"])
            df = df[df["case_id"].isin(qualifying)]

    selected_cases = df["case_id"].unique()[:case_limit]
    df = df[df["case_id"].isin(selected_cases)]

    if len(df) == 0:
        raise HTTPException(status_code=400, detail="Filtre sonrası veri kalmadı")

    return df

# --- Health Check ---
@router.get("/health")
def health_check():
    """Sunucu sağlık kontrolü."""
    return {
        "status": "ok",
        "message": "Process Mining Backend API is running"
    }

# --- Data Count ---
@router.get("/data/count")
def get_data_count(table_name: str = Query(DEFAULT_TABLE)):
    """Tablodaki toplam kayıt sayısını döndürür."""
    try:
        if not supabase:
            return {"count": 0, "error": "Supabase bağlantısı yok"}
        response = supabase.table(table_name).select("*", count="exact", head=True).execute()
        return {"count": response.count or 0, "table_name": table_name}
    except Exception as e:
        return {"count": 0, "error": str(e)}


# --- Data Summary ---
@router.get("/data/summary")
def get_data_summary(table_name: str = Query(DEFAULT_TABLE)):
    """Veri kümesi özeti."""
    try:
        if not supabase:
            raise HTTPException(status_code=500, detail="Supabase bağlantısı yok")

        # Toplam event: count=exact — satır çekmeden anlık sonuç
        count_resp = supabase.table(table_name).select("*", count="exact", head=True).execute()
        total_events = count_resp.count or 0

        # case_id + timestamp: en erken / en geç + benzersiz case sayısı için
        # 5000 satır case_id/timestamp çekmek yeterince hızlı ve temsili
        SAMPLE = 5000
        resp = supabase.table(table_name).select("case_id,timestamp").limit(SAMPLE).execute()
        rows = resp.data if hasattr(resp, "data") else []

        if not rows:
            return {
                "total_events": total_events,
                "total_cases": 0,
                "avg_events_per_case": 0,
                "date_range": {"min": None, "max": None},
            }

        case_ids  = {r["case_id"] for r in rows if r.get("case_id") is not None}
        timestamps = [r["timestamp"] for r in rows if r.get("timestamp")]

        # Eğer 5000 satırı doldurduysa tabloda daha fazla case olabilir;
        # tam sayı için count_exact / (avg event per case) tahmini
        sample_cases = len(case_ids)
        avg_events   = round(total_events / sample_cases, 2) if sample_cases > 0 else 0
        # Toplam case tahmini: total_events / avg_per_case (sample'dan)
        total_cases  = round(total_events / avg_events) if avg_events > 0 else sample_cases

        date_min = min(timestamps) if timestamps else None
        date_max = max(timestamps) if timestamps else None

        # Tarih için ayrıca en küçük / en büyük olanı da çek (doğruluk için)
        try:
            r_min = supabase.table(table_name).select("timestamp").order("timestamp", desc=False).limit(1).execute()
            r_max = supabase.table(table_name).select("timestamp").order("timestamp", desc=True).limit(1).execute()
            if r_min.data: date_min = r_min.data[0]["timestamp"]
            if r_max.data: date_max = r_max.data[0]["timestamp"]
        except Exception:
            pass

        return {
            "total_events": total_events,
            "total_cases": total_cases,
            "avg_events_per_case": avg_events,
            "date_range": {"min": date_min, "max": date_max},
        }
    except HTTPException:
        raise
    except Exception as e:
        return {
            "error": str(e),
            "total_events": 0,
            "total_cases": 0,
            "avg_events_per_case": 0,
            "date_range": {"min": None, "max": None},
        }

# --- Data Sample ---
@router.get("/data/sample")
def get_data_sample(limit: int = Query(10, ge=1, le=1000), offset: int = Query(0, ge=0), table_name: str = Query(DEFAULT_TABLE)):
    """Örnek veri kayıtları."""
    try:
        response = get_logs(limit=limit, offset=offset, table_name=table_name)
        
        # Supabase APIResponse objesini kontrol et
        if hasattr(response, 'error') and response.error:
            raise HTTPException(status_code=500, detail=str(response.error))
        
        data = response.data if hasattr(response, 'data') else response.get("data", [])
        
        return {
            "count": len(data),
            "data": data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# === PM4PY HELPER FUNCTIONS ===
def preprocess(df):
    """Raw veriyi temizler, timestamp formatını düzeltir ve sıralar."""
    df = df.copy()
    df['timestamp'] = pd.to_datetime(df['timestamp'], utc=True, errors='coerce')
    df = df.dropna(subset=['case_id', 'activity', 'timestamp'])
    df.sort_values(by=['case_id', 'timestamp'], inplace=True)
    return df

def to_pm4py_log(df, case_id_col='case_id', activity_col='activity', timestamp_col='timestamp'):
    """Pandas DataFrame'ini PM4Py Event Log'a çevirir."""
    df = pm4py.format_dataframe(df, case_id=case_id_col, activity_key=activity_col, timestamp_key=timestamp_col)
    return pm4py.convert_to_event_log(df)

def discover_and_save(log, algorithm="inductive", name="analysis"):
    """PM4Py discovery çalıştırıp Petri net PNG olarak kaydeder."""
    try:
        if algorithm == "alpha":
            net, im, fm = pm4py.discover_petri_net_alpha(log)
        elif algorithm == "heuristics":
            net, im, fm = pm4py.discover_petri_net_heuristics(log)
        else:
            net, im, fm = pm4py.discover_petri_net_inductive(log)


        out_path = os.path.join(OUTPUT_DIR, f"{name}_{algorithm}.png")
        pm4py.save_vis_petri_net(net, im, fm, out_path)
        return out_path

    except Exception as e:
        raise Exception(f"Discovery error: {e}")

# --- Discovery Endpoint ---
@router.post("/discovery")
def run_discovery(
    algorithm: str = Query("inductive", enum=["inductive", "alpha", "heuristics"]),
    limit: int = Query(500, ge=1, le=10000),
    offset: int = Query(0, ge=0)
):
    """PM4Py ile süreç keşfi yapıp Petri net modeli üretir."""
    try:
        # 1. Supabase'den veri çek
        response = get_logs(limit=limit, offset=offset)
        
        # Supabase APIResponse objesini kontrol et
        if hasattr(response, 'error') and response.error:
            raise HTTPException(status_code=400, detail=str(response.error))
        
        data = response.data if hasattr(response, 'data') else response.get("data", [])
        
        if not data:
            raise HTTPException(status_code=400, detail="Veri bulunamadı")
        
        df = pd.DataFrame(data)
        
        # 2. Ön işlem
        df = preprocess(df)
        
        if len(df) == 0:
            raise HTTPException(status_code=400, detail="Temizleme sonrası veri kalmadı")
        
        # 3. PM4Py log'a çevir
        log = to_pm4py_log(df)
        
        # 4. Discovery ve kaydetme
        out_path = discover_and_save(log, algorithm=algorithm, name="petri_net")
        
        # 5. PNG dosya adını dön
        filename = os.path.basename(out_path)
        
        return {
            "success": True,
            "algorithm": algorithm,
            "events_analyzed": len(df),
            "image_url": f"/outputs/{filename}",
            "message": f"{algorithm} algoritması ile Petri net başarıyla oluşturuldu"
        }
    
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Discovery hatası: {str(e)}")

@router.get("/available-algorithms")
def get_available_algorithms():
    """Mevcut keşif algoritmaları listesi."""
    return {
        "algorithms": ["inductive", "alpha", "heuristics"],
        "descriptions": {
            "inductive": "Inductive Miner - Rekursif yapıyı iyi keşfeder",
            "alpha": "Alpha Miner - Klasik algoritma, basit prosesler için",
            "heuristics": "Heuristics Miner - Gürültülü veriler için iyi"
        }
    }

# --- Petri Net Image (no-cache) ---
@router.get("/petri-image/{filename}")
def get_petri_image(filename: str):
    """Petri net PNG'sini cache olmadan servis eder."""
    safe_name = os.path.basename(filename)
    out_path = os.path.join(OUTPUT_DIR, safe_name)
    if not os.path.isfile(out_path):
        raise HTTPException(status_code=404, detail="Görsel bulunamadı")
    return FileResponse(
        out_path,
        media_type="image/png",
        headers={"Cache-Control": "no-store, no-cache, must-revalidate", "Pragma": "no-cache"},
    )

# --- Discover Process (Single Algorithm) ---
@router.post("/discover-process")
def discover_process(body: dict):
    """
    Tek bir algoritma ile process discovery
    
    Body:
    {
        "algorithm": "inductive|alpha|heuristics",
        "limit": 500 (opsiyonel)
    }
    """
    try:
        algorithm = body.get("algorithm", "inductive").lower()

        if algorithm not in ["inductive", "alpha", "heuristics"]:
            raise HTTPException(status_code=400, detail=f"Bilinmeyen algoritma: {algorithm}")

        df = get_filtered_df(body)
        log = to_pm4py_log(df)

        if algorithm == "inductive":
            net, im, fm = ProcessDiscovery.discover_with_inductive_miner(log)
        elif algorithm == "alpha":
            net, im, fm = ProcessDiscovery.discover_with_alpha_miner(log)
        elif algorithm == "heuristics":
            threshold = max(0.1, min(0.99, float(body.get("dependency_threshold", 0.5))))
            net, im, fm = ProcessDiscovery.discover_with_heuristics_miner(log, dependency_threshold=threshold)
        else:
            raise HTTPException(status_code=400, detail=f"Bilinmeyen algoritma: {algorithm}")

        if net is None:
            raise HTTPException(status_code=500, detail=f"Algoritma çalıştırılamadı: {algorithm}")

        metrics = ModelMetrics.get_model_quality_score(log, net, im, fm)
        
        # Petri net bilgisi
        petri_info = ProcessDiscovery.get_petri_net_info(net, im, fm)
        
        # Visualisasyon kaydet
        out_path = os.path.join(OUTPUT_DIR, f"petri_net_{algorithm}.png")
        pm4py.save_vis_petri_net(net, im, fm, out_path)
        
        return {
            "status": "success",
            "algorithm": algorithm,
            "events_analyzed": len(df),
            "cases_analyzed": df['case_id'].nunique(),
            "metrics": metrics,
            "petri_net_info": petri_info,
            "image_filename": os.path.basename(out_path)
        }
        
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Discovery hatası: {str(e)}")

# --- Conformance Checking ---
@router.post("/conformance")
def get_conformance(body: dict):
    """
    Token-based replay ile her case için uyumluluk analizi.

    Body: { "algorithm": "inductive", "limit": 1000 }
    """
    try:
        algorithm = body.get("algorithm", "inductive")
        df = get_filtered_df(body)
        log = to_pm4py_log(df)

        # Model keşfi
        if algorithm == "alpha":
            net, im, fm = pm4py.discover_petri_net_alpha(log)
        elif algorithm == "heuristics":
            net, im, fm = pm4py.discover_petri_net_heuristics(log)
        else:
            net, im, fm = pm4py.discover_petri_net_inductive(log)

        # Token-based replay — her trace için ayrı sonuç
        from pm4py.algo.conformance.tokenreplay import algorithm as token_replay
        replay_results = token_replay.apply(log, net, im, fm)

        # Case ID'lerini log'dan al
        case_ids = [
            trace.attributes.get("concept:name", f"case_{i}")
            for i, trace in enumerate(log)
        ]

        # Case bazında sonuçlar
        case_results = []
        for case_id, res in zip(case_ids, replay_results):
            fitness       = round(float(res.get("trace_fitness", 0)), 3)
            missing       = int(res.get("missing_tokens", 0))
            remaining     = int(res.get("remaining_tokens", 0))
            is_fit        = bool(res.get("trace_is_fit", False))

            if is_fit:
                status = "fit"
            elif fitness >= 0.5:
                status = "partial"
            else:
                status = "non_fit"

            case_results.append({
                "case_id":          str(case_id),
                "status":           status,
                "fitness":          fitness,
                "missing_tokens":   missing,
                "remaining_tokens": remaining,
            })

        total     = len(case_results)
        fit_count = sum(1 for c in case_results if c["status"] == "fit")
        par_count = sum(1 for c in case_results if c["status"] == "partial")
        non_count = sum(1 for c in case_results if c["status"] == "non_fit")
        avg_fit   = round(sum(c["fitness"] for c in case_results) / total, 3) if total else 0

        # En kötü 20 case (fitness'a göre artan sıra)
        worst = sorted(case_results, key=lambda x: x["fitness"])[:20]

        # Fitness dağılımı (bucket)
        buckets = {"0.0–0.2": 0, "0.2–0.4": 0, "0.4–0.6": 0, "0.6–0.8": 0, "0.8–1.0": 0, "1.0": 0}
        for c in case_results:
            f = c["fitness"]
            if f == 1.0:
                buckets["1.0"] += 1
            elif f >= 0.8:
                buckets["0.8–1.0"] += 1
            elif f >= 0.6:
                buckets["0.6–0.8"] += 1
            elif f >= 0.4:
                buckets["0.4–0.6"] += 1
            elif f >= 0.2:
                buckets["0.2–0.4"] += 1
            else:
                buckets["0.0–0.2"] += 1

        distribution = [
            {"range": k, "count": v, "percentage": round(v / total * 100, 1)}
            for k, v in buckets.items()
        ]

        return {
            "status":          "success",
            "algorithm":       algorithm,
            "events_analyzed": len(df),
            "cases_analyzed":  total,
            "overall": {
                "fit_cases":       fit_count,
                "partial_cases":   par_count,
                "non_fit_cases":   non_count,
                "compliance_rate": round(fit_count / total * 100, 1) if total else 0,
                "avg_fitness":     avg_fit,
            },
            "distribution": distribution,
            "worst_cases":   worst,
        }

    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Conformance hatası: {str(e)}")


# --- Performance Analysis ---
@router.post("/performance")
def get_performance(body: dict):
    """
    Case süresi ve aktivite bekleme süresi istatistikleri.

    Body: { "limit": 1000 }
    """
    try:
        df = get_filtered_df(body)
        return {"status": "success", **_performance_payload(df)}

    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Performans analizi hatası: {str(e)}")


# --- Case Detail (Inspector) ---
@router.post("/case-detail")
def get_case_detail(body: dict):
    """
    Tek bir case'in adım adım timeline'ını ve istatistiklerini döner.
    Body: { "case_id": "173694" }
    """
    try:
        case_id_raw = body.get("case_id", "")
        if not case_id_raw:
            raise HTTPException(status_code=400, detail="case_id gerekli")

        table_name = body.get("table_name", DEFAULT_TABLE)

        # Tüm veriyi çek (case_limit yok, tek case arıyoruz)
        response = get_logs(limit=50000, offset=0, table_name=table_name)
        if hasattr(response, "error") and response.error:
            raise HTTPException(status_code=400, detail=str(response.error))
        data = response.data if hasattr(response, "data") else response.get("data", [])
        if not data:
            raise HTTPException(status_code=400, detail="Veri bulunamadı")

        df = pd.DataFrame(data)
        df = preprocess(df)

        # Case ID string eşleşmesi
        case_df = df[df["case_id"].astype(str) == str(case_id_raw)].copy()
        if case_df.empty:
            raise HTTPException(status_code=404, detail=f"Case '{case_id_raw}' bulunamadı")

        case_df = case_df.sort_values("timestamp").reset_index(drop=True)

        # Bekleme sürelerini hesapla
        case_df["next_ts"]    = case_df["timestamp"].shift(-1)
        case_df["wait_hours"] = (
            (case_df["next_ts"] - case_df["timestamp"]).dt.total_seconds() / 3600
        )

        total_hours = (case_df["timestamp"].max() - case_df["timestamp"].min()).total_seconds() / 3600
        total_days  = total_hours / 24

        # Adımlar
        steps = []
        for i, row in case_df.iterrows():
            wh = row["wait_hours"]
            steps.append({
                "order":      i + 1,
                "activity":   row["activity"],
                "timestamp":  row["timestamp"].isoformat(),
                "wait_hours": round(float(wh), 2) if pd.notna(wh) and float(wh) >= 0 else None,
            })

        # En uzun bekleme
        valid_waits = case_df.dropna(subset=["wait_hours"])
        if not valid_waits.empty:
            max_wait_row   = valid_waits.loc[valid_waits["wait_hours"].idxmax()]
            longest_wait   = {"activity": max_wait_row["activity"], "hours": round(float(max_wait_row["wait_hours"]), 2)}
        else:
            longest_wait   = None

        # Dataset ortalamasıyla karşılaştırma
        all_case_stats = (
            df.groupby("case_id")["timestamp"]
            .agg(start="min", end="max")
            .reset_index()
        )
        all_case_stats["duration_days"] = (all_case_stats["end"] - all_case_stats["start"]).dt.total_seconds() / 86400
        avg_days    = float(all_case_stats["duration_days"].mean())
        median_days = float(all_case_stats["duration_days"].median())
        pct_rank    = float((all_case_stats["duration_days"] <= total_days).mean() * 100)

        # Bu case'in outcome'u
        activities = case_df["activity"].values
        if "A_ACCEPTED" in activities:
            outcome = "Kabul Edildi"
        elif "A_DECLINED" in activities:
            outcome = "Reddedildi"
        elif "Ödeme Yapıldı" in activities:
            outcome = "Tamamlandı"
        elif "Talep Reddedildi" in activities:
            outcome = "Reddedildi"
        else:
            outcome = case_df["activity"].iloc[-1]  # son aktiviteyi outcome say

        return {
            "case_id":      str(case_id_raw),
            "outcome":      outcome,
            "total_hours":  round(total_hours, 2),
            "total_days":   round(total_days, 2),
            "step_count":   len(case_df),
            "start_time":   case_df["timestamp"].min().isoformat(),
            "end_time":     case_df["timestamp"].max().isoformat(),
            "longest_wait": longest_wait,
            "comparison": {
                "avg_days":    round(avg_days, 2),
                "median_days": round(median_days, 2),
                "pct_rank":    round(pct_rank, 1),
            },
            "steps": steps,
        }

    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Case detay hatası: {str(e)}")


# --- Variant Analysis ---
@router.post("/variants")
def get_variants(body: dict):
    """
    Trace varyantlarını ve aktivite frekanslarını döndürür.

    Body: { "limit": 1000 }
    """
    try:
        df = get_filtered_df(body)
        return {"status": "success", **_variants_payload(df)}

    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Varyant analizi hatası: {str(e)}")


# --- Compare Models ---
@router.post("/compare-models")
def compare_models(body: dict):
    """
    Birden fazla algoritma ile process discovery ve karşılaştırma
    
    Body:
    {
        "algorithms": ["inductive", "alpha", "heuristics"],
        "limit": 500 (opsiyonel)
    }
    """
    try:
        algorithms = body.get("algorithms", ["inductive", "alpha", "heuristics"])
        df = get_filtered_df(body)
        log = to_pm4py_log(df)
        
        # Algoritmaları karşılaştır
        comparison_result = ProcessComparison.get_comparison_table(log, algorithms)
        
        return {
            "status": "success",
            "events_analyzed": len(df),
            "cases_analyzed": df['case_id'].nunique(),
            "ranking": comparison_result["ranking"],
            "best_algorithm": comparison_result["best_algorithm"]
        }
        
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Karşılaştırma hatası: {str(e)}")

# --- Get Metrics ---
@router.post("/get-metrics")
def get_metrics_endpoint(body: dict):
    """
    Mevcut bir model için metrikleri hesapla
    (Frontend tarafından kullanılacak)
    
    Body:
    {
        "algorithm": "inductive|alpha|heuristics",
        "limit": 500
    }
    """
    try:
        algorithm = body.get("algorithm", "inductive").lower()
        df = get_filtered_df(body)
        log = to_pm4py_log(df)

        # Algoritma çalıştır
        if algorithm == "inductive":
            net, im, fm = ProcessDiscovery.discover_with_inductive_miner(log)
        elif algorithm == "alpha":
            net, im, fm = ProcessDiscovery.discover_with_alpha_miner(log)
        elif algorithm == "heuristics":
            net, im, fm = ProcessDiscovery.discover_with_heuristics_miner(log, dependency_threshold=0.5)
        else:
            raise HTTPException(status_code=400, detail=f"Bilinmeyen algoritma: {algorithm}")

        if net is None:
            raise HTTPException(status_code=500, detail=f"Algoritma çalıştırılamadı: {algorithm}")

        metrics = ModelMetrics.get_model_quality_score(log, net, im, fm)

        return {
            "status": "success",
            "algorithm": algorithm,
            "metrics": metrics
        }
        
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Metrik hesaplama hatası: {str(e)}")


# --- AI Chat (Gemini) ---
SYSTEM_PROMPT = """
Sen süreç madenciliği (process mining) asistanısın. Sadece Türkçe yanıt verirsin.

VERİ SETİ: BPI Challenge 2012 bankacılık kredi süreci.

ROL:
- Sadece teknik analiz yaparsın
- Sohbet yok, sadece yorum
- veri yoksa yardımcı olmaya çalış ama daha iyi cevaplar için veri verilmesini belirt

ÇIKTI FORMATI ZORUNLU:
- 2-3 madde
- Her madde: emoji + kısa cümle
- Maksimum 10-15 kelime
- Tek cümle = tek madde
- Ama kısa yanıtlardan sonra dilerseniz detaylandırabilirm diyebilirsin

ASLA kullanma:
- "***", "##", markdown başlık
- uzun paragraf
- akademik açıklama
- liste dışı yazı

EMOJİ KURALI:
📊 fitness | 🎯 precision | ⚠️ problem | 💡 öneri | ⏱ süre | 🔁 döngü

DETAY MODU:
Kullanıcı "detay/açıkla" derse:
- 5-7 madde
- max 15 kelime

ÖNERİ DİLİ:
- "yapmalısınız" yerine "düşünebilirsiniz"

FORMAT DIŞI YANIT = YENİDEN YAZ
"""


@router.post("/chat")
def chat_with_agent(body: dict):
    try:
        api_key = os.getenv("GEMINI_API_KEY", "")
        if not api_key:
            raise HTTPException(status_code=400, detail="GEMINI_API_KEY .env dosyasında tanımlı değil")

        message = body.get("message", "").strip()
        context = body.get("context", "")
        history = body.get("history", [])

        if not message:
            raise HTTPException(status_code=400, detail="Mesaj boş olamaz")

        full_message = message
        if context:
            full_message = f"Analiz sonuçları:\n{context}\n\nSorum: {message}"

        # Sohbet geçmişini Gemini formatına çevir
        contents = []
        for h in history:
            role = "user" if h.get("role") == "user" else "model"
            contents.append(types.Content(role=role, parts=[types.Part(text=h.get("content", ""))]))
        contents.append(types.Content(role="user", parts=[types.Part(text=full_message)]))

        client = genai.Client(api_key=api_key)
        for model_name in ("gemini-2.5-flash-preview-05-20", "gemini-2.5-flash", "gemini-1.5-flash", "gemini-1.5-pro"):
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=contents,
                    config=types.GenerateContentConfig(system_instruction=SYSTEM_PROMPT),
                )
                return {"reply": response.text}
            except Exception as model_err:
                err_str = str(model_err)
                if "NOT_FOUND" in err_str or "404" in err_str:
                    continue
                raise model_err

        raise HTTPException(status_code=503, detail="Kullanılabilir Gemini modeli bulunamadı")

    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent hatası: {str(e)}")


# ============================================================
#  CANLI VERİ — Application Insights (D365 F&O telemetri)
# ============================================================
# Gerçek BalSoft telemetrisi iki minable süreç içerir: Depo Dalga İşleme
# (wave) ve Toplu İş Yürütme (batch). KQL şablonları appinsights.py'de.

def _resolve_kql(body: dict):
    """Body'den ya hazır 'process' kataloğunu ya da serbest 'query'yi çözer."""
    raw = (body.get("query") or "").strip()
    if raw:
        return raw, body.get("case_col", "case_id"), body.get("activity_col", "activity"), body.get("timestamp_col", "timestamp")
    process = body.get("process", "wave")
    days = int(body.get("days", appinsights.PROCESS_CATALOG.get(process, {}).get("default_days", 30)))
    # Vaka sayısı kullanıcı seçimli: 100-500 arası, varsayılan 250.
    case_limit = max(100, min(500, int(body.get("cases", 250))))
    return appinsights.build_log_kql(process, days, case_limit), "case_id", "activity", "timestamp"


def _live_df(body: dict):
    """App Insights'tan canlı olay günlüğü çekip ön-işlenmiş DataFrame döndürür."""
    kql, case_col, activity_col, timestamp_col = _resolve_kql(body)
    result = appinsights.run_query(kql)
    events = appinsights.to_event_log(result, case_col, activity_col, timestamp_col)
    df = preprocess(pd.DataFrame(events))
    if df.empty:
        raise HTTPException(status_code=400, detail="Canlı veri temizleme sonrası boş kaldı.")
    return df


# === Paylaşılan analiz hesaplayıcıları (Supabase + canlı tarafça kullanılır) ===
def _variants_payload(df):
    """Ön-işlenmiş df'ten trace varyantları + aktivite frekansları."""
    traces = (
        df.groupby("case_id")["activity"]
        .apply(lambda acts: " → ".join(acts.tolist()))
        .reset_index().rename(columns={"activity": "trace"})
    )
    variant_counts = traces["trace"].value_counts().reset_index()
    variant_counts.columns = ["trace", "frequency"]
    variant_counts["percentage"] = (variant_counts["frequency"] / len(traces) * 100).round(2)
    variant_counts["rank"] = range(1, len(variant_counts) + 1)

    activity_counts = df["activity"].value_counts().reset_index()
    activity_counts.columns = ["activity", "count"]
    activity_counts["percentage"] = (activity_counts["count"] / len(df) * 100).round(2)

    return {
        "events_analyzed": len(df),
        "cases_analyzed": int(traces.shape[0]),
        "unique_variants": int(len(variant_counts)),
        "top_variants": variant_counts.head(10).to_dict(orient="records"),
        "top_activities": activity_counts.head(15).to_dict(orient="records"),
    }


def _performance_payload(df):
    """Ön-işlenmiş df'ten case süresi + aktivite bekleme istatistikleri."""
    case_stats = (
        df.groupby("case_id")["timestamp"].agg(start="min", end="max").reset_index()
    )
    case_stats["duration_hours"] = (case_stats["end"] - case_stats["start"]).dt.total_seconds() / 3600
    case_stats["duration_days"] = case_stats["duration_hours"] / 24

    avg_days = float(case_stats["duration_days"].mean())
    median_days = float(case_stats["duration_days"].median())
    min_days = float(case_stats["duration_days"].min())
    max_days = float(case_stats["duration_days"].max())

    bins = [0, 1, 7, 30, 90, float("inf")]
    labels = ["<1 gün", "1-7 gün", "7-30 gün", "30-90 gün", "90+ gün"]
    case_stats["bucket"] = pd.cut(case_stats["duration_days"], bins=bins, labels=labels)
    distribution = case_stats["bucket"].value_counts().reindex(labels).fillna(0).astype(int).reset_index()
    distribution.columns = ["bucket", "count"]
    distribution["percentage"] = (distribution["count"] / len(case_stats) * 100).round(1)

    df_sorted = df.sort_values(["case_id", "timestamp"]).copy()
    df_sorted["next_ts"] = df_sorted.groupby("case_id")["timestamp"].shift(-1)
    df_sorted["wait_hours"] = (df_sorted["next_ts"] - df_sorted["timestamp"]).dt.total_seconds() / 3600
    act_wait = (
        df_sorted.groupby("activity")["wait_hours"].mean().dropna()
        .sort_values(ascending=False).head(15).reset_index()
    )
    act_wait.columns = ["activity", "avg_wait_hours"]
    act_wait["avg_wait_hours"] = act_wait["avg_wait_hours"].round(2)

    slow_ids = case_stats.nlargest(5, "duration_days")["case_id"].tolist()
    top_slow = []
    for cid in slow_ids:
        dur = round(float(case_stats.loc[case_stats["case_id"] == cid, "duration_days"].iloc[0]), 2)
        case_df = df_sorted[df_sorted["case_id"] == cid].sort_values("timestamp")
        steps = []
        for _, row in case_df.iterrows():
            wh = row.get("wait_hours")
            steps.append({
                "activity": row["activity"],
                "wait_hours": round(float(wh), 2) if pd.notna(wh) and float(wh) >= 0 else None,
            })
        top_slow.append({"case_id": cid, "duration_days": dur, "steps": steps})

    fastest_one = case_stats.nsmallest(1, "duration_days")[["case_id", "duration_days"]]
    next_four = case_stats[case_stats["duration_days"] > 0].nsmallest(4, "duration_days")[["case_id", "duration_days"]]
    top_fast = (
        pd.concat([fastest_one, next_four]).drop_duplicates(subset="case_id").head(5)
        .assign(duration_days=lambda x: x["duration_days"].round(2)).to_dict(orient="records")
    )

    return {
        "events_analyzed": len(df),
        "cases_analyzed": int(len(case_stats)),
        "summary": {
            "avg_days": round(avg_days, 2), "median_days": round(median_days, 2),
            "min_days": round(min_days, 2), "max_days": round(max_days, 2),
            # Saat hassasiyeti (kısa süreçler için gün ~0 kalmasın diye)
            "avg_hours": round(avg_days * 24, 2), "median_hours": round(median_days * 24, 2),
            "min_hours": round(min_days * 24, 2), "max_hours": round(max_days * 24, 2),
        },
        "distribution": distribution.to_dict(orient="records"),
        "activity_wait": act_wait.to_dict(orient="records"),
        "slowest_cases": top_slow,
        "fastest_cases": top_fast,
    }


# --- Bağlantı durumu ---
@router.get("/appinsights/status")
def appinsights_status():
    """App Insights yapılandırma durumunu döndürür (gizli değer sızdırmaz)."""
    return appinsights.status()


# --- Süreç kataloğu (gerçek telemetriden türetildi) ---
@router.get("/appinsights/processes")
def appinsights_processes():
    """Canlı telemetriden minable süreçlerin kataloğunu döndürür."""
    return {"processes": appinsights.list_processes()}


# --- Süreç için KQL şablonu ---
@router.get("/appinsights/query-template")
def appinsights_query_template(process: str = Query("wave"), days: int = Query(30)):
    """Bir süreç için olay günlüğü KQL şablonunu döndürür (editörde göstermek için)."""
    try:
        return {"query": appinsights.build_log_kql(process, days)}
    except appinsights.AppInsightsError as e:
        raise HTTPException(status_code=e.status, detail=str(e))


# --- Genel bakış (canlı KPI'lar) ---
@router.post("/appinsights/overview")
def appinsights_overview(body: dict):
    """
    Seçili süreç için canlı KPI'lar + en sık aktiviteler.
    Body: { "process": "wave|batch", "days": 30 }
    """
    try:
        process = body.get("process", "wave")
        p = appinsights._process(process)
        days = int(body.get("days", p["default_days"]))

        ov = appinsights.rows_to_dicts(appinsights.run_query(appinsights.build_overview_kql(process, days)))
        acts = appinsights.rows_to_dicts(appinsights.run_query(appinsights.build_activities_kql(process, days)))

        kpi = ov[0] if ov else {}
        total_acts = sum(int(a.get("c", 0)) for a in acts) or 1
        top_activities = [
            {"activity": a.get("activity"), "count": int(a.get("c", 0)),
             "percentage": round(int(a.get("c", 0)) / total_acts * 100, 1)}
            for a in acts
        ]

        return {
            "status": "success",
            "process": process,
            "label": p["label"],
            "scope_label": p["scope_label"],
            "days": days,
            "kpi": {
                "events": int(kpi.get("events", 0) or 0),
                "cases": int(kpi.get("cases", 0) or 0),
                "activities": int(kpi.get("activities", 0) or 0),
                "scope": int(kpi.get("scope", 0) or 0),
                "date_min": kpi.get("tmin"),
                "date_max": kpi.get("tmax"),
            },
            "top_activities": top_activities,
        }
    except appinsights.AppInsightsError as e:
        raise HTTPException(status_code=e.status, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Genel bakış hatası: {str(e)}")


# --- En yavaş formlar (pageViews performansı) ---
@router.post("/appinsights/slowest-forms")
def appinsights_slowest_forms(body: dict):
    """
    En yavaş D365 formları (form yükleme süreleri, pageViews tablosu).
    Süreçten bağımsızdır. Body: { "days": 30, "top": 15 }
    """
    try:
        days = int(body.get("days", 30))
        top = int(body.get("top", 15))
        rows = appinsights.rows_to_dicts(
            appinsights.run_query(appinsights.build_slowest_forms_kql(days, top))
        )
        forms = [
            {
                "form": r.get("form"),
                "calls": int(r.get("calls", 0) or 0),
                "avg_ms": round(float(r.get("avg_ms", 0) or 0), 1),
                "p95_ms": round(float(r.get("p95_ms", 0) or 0), 1),
                "max_ms": round(float(r.get("max_ms", 0) or 0), 1),
            }
            for r in rows
        ]
        return {"status": "success", "days": days, "forms": forms}
    except appinsights.AppInsightsError as e:
        raise HTTPException(status_code=e.status, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Form performansı hatası: {str(e)}")


# --- Canlı varyant analizi ---
@router.post("/appinsights/variants")
def appinsights_variants(body: dict):
    """Canlı veriden trace varyantları + aktivite frekansları. Body: {process, days}"""
    try:
        df = _live_df(body)
        return {"status": "success", "process": body.get("process", "wave"), **_variants_payload(df)}
    except appinsights.AppInsightsError as e:
        raise HTTPException(status_code=e.status, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Canlı varyant analizi hatası: {str(e)}")


# --- Canlı performans analizi ---
@router.post("/appinsights/performance")
def appinsights_performance(body: dict):
    """Canlı veriden case süresi + bekleme istatistikleri. Body: {process, days}"""
    try:
        df = _live_df(body)
        return {"status": "success", "process": body.get("process", "wave"), **_performance_payload(df)}
    except appinsights.AppInsightsError as e:
        raise HTTPException(status_code=e.status, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Canlı performans analizi hatası: {str(e)}")


# --- Canlı sorgu + olay günlüğü önizlemesi ---
@router.post("/appinsights/query")
def appinsights_query(body: dict):
    """
    Seçili süreç (ya da serbest KQL) için canlı olay günlüğü önizlemesi.
    Body: { "process": "wave|batch", "days": 30 }  ya da  { "query": "<KQL>" }
    """
    try:
        kql, case_col, activity_col, timestamp_col = _resolve_kql(body)
        preview = int(body.get("preview", 50))

        result = appinsights.run_query(kql)
        events = appinsights.to_event_log(result, case_col, activity_col, timestamp_col)

        df = pd.DataFrame(events)
        if df.empty:
            return {"status": "success", "columns": result["columns"], "total_events": 0,
                    "total_cases": 0, "preview": [],
                    "message": "Sorgu çalıştı ancak eşleşen olay bulunamadı."}

        df = preprocess(df)
        return {
            "status": "success",
            "columns": result["columns"],
            "total_events": int(len(df)),
            "total_cases": int(df["case_id"].nunique()),
            "preview": df.head(preview).assign(
                timestamp=lambda x: x["timestamp"].astype(str)
            ).to_dict(orient="records"),
        }
    except appinsights.AppInsightsError as e:
        raise HTTPException(status_code=e.status, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Canlı sorgu hatası: {str(e)}")


# --- Canlı veriden süreç keşfi ---
@router.post("/appinsights/discover")
def appinsights_discover(body: dict):
    """
    App Insights'tan canlı olay günlüğü çekip PM4Py keşfi çalıştırır,
    Petri net görseli üretir. (Supabase'e yazmadan, uçtan uca canlı.)
    Body: { "process": "wave|batch", "days": 30, "algorithm": "inductive" }
    """
    try:
        algorithm = body.get("algorithm", "inductive").lower()
        if algorithm not in ("inductive", "alpha", "heuristics"):
            raise HTTPException(status_code=400, detail=f"Bilinmeyen algoritma: {algorithm}")

        kql, case_col, activity_col, timestamp_col = _resolve_kql(body)
        result = appinsights.run_query(kql)
        events = appinsights.to_event_log(result, case_col, activity_col, timestamp_col)

        df = preprocess(pd.DataFrame(events))
        if df.empty:
            raise HTTPException(status_code=400, detail="Canlı veri temizleme sonrası boş kaldı.")

        log = to_pm4py_log(df)

        # net/im/fm al → hem metrik hesapla hem görseli kaydet
        if algorithm == "alpha":
            net, im, fm = ProcessDiscovery.discover_with_alpha_miner(log)
        elif algorithm == "heuristics":
            net, im, fm = ProcessDiscovery.discover_with_heuristics_miner(log, dependency_threshold=0.5)
        else:
            net, im, fm = ProcessDiscovery.discover_with_inductive_miner(log)
        if net is None:
            raise HTTPException(status_code=500, detail=f"Algoritma çalıştırılamadı: {algorithm}")

        out_path = os.path.join(OUTPUT_DIR, "appinsights_live_" + algorithm + ".png")
        pm4py.save_vis_petri_net(net, im, fm, out_path)

        # Kalite metrikleri (fitness / precision / generalization / simplicity)
        try:
            metrics = ModelMetrics.get_model_quality_score(log, net, im, fm)
        except Exception as me:
            metrics = {"error": str(me)}

        return {
            "status": "success",
            "source": "application_insights",
            "process": body.get("process", "wave"),
            "algorithm": algorithm,
            "events_analyzed": int(len(df)),
            "cases_analyzed": int(df["case_id"].nunique()),
            "image_filename": os.path.basename(out_path),
            "metrics": metrics,
        }
    except appinsights.AppInsightsError as e:
        raise HTTPException(status_code=e.status, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Canlı keşif hatası: {str(e)}")