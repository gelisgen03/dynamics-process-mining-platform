from fastapi import APIRouter, HTTPException, Query
from .dbconnect import get_logs, supabase
from .process_discovery import ProcessDiscovery
from .model_metrics import ModelMetrics
from .comparison import ProcessComparison
import pandas as pd
import pm4py
import os

router = APIRouter(prefix="/api", tags=["process-mining"])

# === OUTPUT DIRECTORY ===
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "outputs")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Graphviz yolunu ekle
os.environ["PATH"] += os.pathsep + r"C:\Program Files\Graphviz\bin"

# --- Health Check ---
@router.get("/health")
def health_check():
    """Sunucu sağlık kontrolü."""
    return {
        "status": "ok",
        "message": "Process Mining Backend API is running"
    }

# --- Data Summary ---
@router.get("/data/summary")
def get_data_summary():
    """Veri kümesi özeti (event sayısı, case sayısı, zaman aralığı)."""
    try:
        response = get_logs(limit=10000, offset=0)
        
        # Supabase APIResponse objesini kontrol et
        if hasattr(response, 'error') and response.error:
            return {
                "total_events": 0,
                "total_cases": 0,
                "date_range": {"min": None, "max": None},
                "avg_events_per_case": 0,
                "error": str(response.error)
            }
        
        data = response.data if hasattr(response, 'data') else response.get("data", [])
        
        if not data:
            return {
                "total_events": 0,
                "total_cases": 0,
                "date_range": {"min": None, "max": None},
                "avg_events_per_case": 0
            }
        
        df = pd.DataFrame(data)
        
        # Sütun adlarını bul
        case_col = None
        timestamp_col = None
        
        for col in df.columns:
            if "case" in col.lower() or "id" in col.lower():
                case_col = col
            if "time" in col.lower() or "timestamp" in col.lower():
                timestamp_col = col
        
        total_events = len(df)
        total_cases = df[case_col].nunique() if case_col else 0
        avg_events = total_events / total_cases if total_cases > 0 else 0
        
        date_min = df[timestamp_col].min() if timestamp_col else None
        date_max = df[timestamp_col].max() if timestamp_col else None
        
        return {
            "total_events": int(total_events),
            "total_cases": int(total_cases),
            "avg_events_per_case": round(avg_events, 2),
            "date_range": {
                "min": str(date_min) if date_min else None,
                "max": str(date_max) if date_max else None
            }
        }
    except Exception as e:
        return {
            "error": str(e),
            "total_events": 0,
            "total_cases": 0,
            "avg_events_per_case": 0,
            "date_range": {"min": None, "max": None}
        }

# --- Data Sample ---
@router.get("/data/sample")
def get_data_sample(limit: int = Query(10, ge=1, le=1000), offset: int = Query(0, ge=0)):
    """Örnek veri kayıtları."""
    try:
        response = get_logs(limit=limit, offset=offset)
        
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
        limit = body.get("limit", 500)
        
        if algorithm not in ["inductive", "alpha", "heuristics"]:
            raise HTTPException(status_code=400, detail=f"Bilinmeyen algoritma: {algorithm}")
        
        # Veri çek
        response = get_logs(limit=limit, offset=0)
        if hasattr(response, 'error') and response.error:
            raise HTTPException(status_code=400, detail=str(response.error))
        
        data = response.data if hasattr(response, 'data') else response.get("data", [])
        if not data:
            raise HTTPException(status_code=400, detail="Veri bulunamadı")
        
        # DataFrame'e çevir ve preprocess
        df = pd.DataFrame(data)
        df = preprocess(df)
        
        # PM4Py log'a çevir
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
        
        # Sonuç kontrolü
        if net is None:
            raise HTTPException(status_code=500, detail=f"Algoritma çalıştırılamadı: {algorithm}")
        
        # Metrikleri hesapla
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
        limit     = body.get("limit", 1000)

        response = get_logs(limit=limit, offset=0)
        if hasattr(response, 'error') and response.error:
            raise HTTPException(status_code=400, detail=str(response.error))

        data = response.data if hasattr(response, 'data') else response.get("data", [])
        if not data:
            raise HTTPException(status_code=400, detail="Veri bulunamadı")

        df = pd.DataFrame(data)
        df = preprocess(df)
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
        limit = body.get("limit", 1000)

        response = get_logs(limit=limit, offset=0)
        if hasattr(response, 'error') and response.error:
            raise HTTPException(status_code=400, detail=str(response.error))

        data = response.data if hasattr(response, 'data') else response.get("data", [])
        if not data:
            raise HTTPException(status_code=400, detail="Veri bulunamadı")

        df = pd.DataFrame(data)
        df = preprocess(df)

        # --- Case süreleri ---
        case_stats = (
            df.groupby("case_id")["timestamp"]
            .agg(start="min", end="max")
            .reset_index()
        )
        case_stats["duration_hours"] = (
            (case_stats["end"] - case_stats["start"])
            .dt.total_seconds() / 3600
        )
        case_stats["duration_days"] = case_stats["duration_hours"] / 24

        avg_days = float(case_stats["duration_days"].mean())
        median_days = float(case_stats["duration_days"].median())
        min_days = float(case_stats["duration_days"].min())
        max_days = float(case_stats["duration_days"].max())

        # --- Süre dağılımı (bucket) ---
        bins   = [0, 1, 7, 30, 90, float("inf")]
        labels = ["<1 gün", "1-7 gün", "7-30 gün", "30-90 gün", "90+ gün"]
        case_stats["bucket"] = pd.cut(
            case_stats["duration_days"], bins=bins, labels=labels
        )
        distribution = (
            case_stats["bucket"]
            .value_counts()
            .reindex(labels)
            .fillna(0)
            .astype(int)
            .reset_index()
        )
        distribution.columns = ["bucket", "count"]
        distribution["percentage"] = (
            distribution["count"] / len(case_stats) * 100
        ).round(1)

        # --- Aktivite başına bekleme süresi ---
        df_sorted = df.sort_values(["case_id", "timestamp"]).copy()
        df_sorted["next_ts"] = df_sorted.groupby("case_id")["timestamp"].shift(-1)
        df_sorted["wait_hours"] = (
            (df_sorted["next_ts"] - df_sorted["timestamp"])
            .dt.total_seconds() / 3600
        )
        act_wait = (
            df_sorted.groupby("activity")["wait_hours"]
            .mean()
            .dropna()
            .sort_values(ascending=False)
            .head(15)
            .reset_index()
        )
        act_wait.columns = ["activity", "avg_wait_hours"]
        act_wait["avg_wait_hours"] = act_wait["avg_wait_hours"].round(2)

        # --- En yavaş / en hızlı 5 case ---
        top_slow = (
            case_stats.nlargest(5, "duration_days")
            [["case_id", "duration_days"]]
            .assign(duration_days=lambda x: x["duration_days"].round(2))
            .to_dict(orient="records")
        )
        top_fast = (
            case_stats[case_stats["duration_days"] > 0]
            .nsmallest(5, "duration_days")
            [["case_id", "duration_days"]]
            .assign(duration_days=lambda x: x["duration_days"].round(2))
            .to_dict(orient="records")
        )

        return {
            "status": "success",
            "events_analyzed": len(df),
            "cases_analyzed": int(len(case_stats)),
            "summary": {
                "avg_days":    round(avg_days, 2),
                "median_days": round(median_days, 2),
                "min_days":    round(min_days, 2),
                "max_days":    round(max_days, 2),
            },
            "distribution": distribution.to_dict(orient="records"),
            "activity_wait": act_wait.to_dict(orient="records"),
            "slowest_cases": top_slow,
            "fastest_cases": top_fast,
        }

    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Performans analizi hatası: {str(e)}")


# --- Variant Analysis ---
@router.post("/variants")
def get_variants(body: dict):
    """
    Trace varyantlarını ve aktivite frekanslarını döndürür.

    Body: { "limit": 1000 }
    """
    try:
        limit = body.get("limit", 1000)

        response = get_logs(limit=limit, offset=0)
        if hasattr(response, 'error') and response.error:
            raise HTTPException(status_code=400, detail=str(response.error))

        data = response.data if hasattr(response, 'data') else response.get("data", [])
        if not data:
            raise HTTPException(status_code=400, detail="Veri bulunamadı")

        df = pd.DataFrame(data)
        df = preprocess(df)

        # Her case için aktivite dizisini hesapla
        traces = (
            df.groupby("case_id")["activity"]
            .apply(lambda acts: " → ".join(acts.tolist()))
            .reset_index()
            .rename(columns={"activity": "trace"})
        )

        # Varyantları frekansa göre sırala
        variant_counts = (
            traces["trace"]
            .value_counts()
            .reset_index()
        )
        variant_counts.columns = ["trace", "frequency"]
        variant_counts["percentage"] = (
            variant_counts["frequency"] / len(traces) * 100
        ).round(2)
        variant_counts["rank"] = range(1, len(variant_counts) + 1)

        # Aktivite frekansları
        activity_counts = (
            df["activity"]
            .value_counts()
            .reset_index()
        )
        activity_counts.columns = ["activity", "count"]
        activity_counts["percentage"] = (
            activity_counts["count"] / len(df) * 100
        ).round(2)

        top_variants = variant_counts.head(10).to_dict(orient="records")
        top_activities = activity_counts.head(15).to_dict(orient="records")

        return {
            "status": "success",
            "events_analyzed": len(df),
            "cases_analyzed": int(traces.shape[0]),
            "unique_variants": int(len(variant_counts)),
            "top_variants": top_variants,
            "top_activities": top_activities,
        }

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
        limit = body.get("limit", 500)
        
        # Veri çek
        response = get_logs(limit=limit, offset=0)
        if hasattr(response, 'error') and response.error:
            raise HTTPException(status_code=400, detail=str(response.error))
        
        data = response.data if hasattr(response, 'data') else response.get("data", [])
        if not data:
            raise HTTPException(status_code=400, detail="Veri bulunamadı")
        
        # DataFrame'e çevir ve preprocess
        df = pd.DataFrame(data)
        df = preprocess(df)
        
        # PM4Py log'a çevir
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
        limit = body.get("limit", 500)
        
        # Veri çek
        response = get_logs(limit=limit, offset=0)
        if hasattr(response, 'error') and response.error:
            raise HTTPException(status_code=400, detail=str(response.error))
        
        data = response.data if hasattr(response, 'data') else response.get("data", [])
        if not data:
            raise HTTPException(status_code=400, detail="Veri bulunamadı")
        
        # DataFrame'e çevir ve preprocess
        df = pd.DataFrame(data)
        df = preprocess(df)
        
        # PM4Py log'a çevir
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
        
        # Sonuç kontrolü
        if net is None:
            raise HTTPException(status_code=500, detail=f"Algoritma çalıştırılamadı: {algorithm}")
        
        # Metrikleri hesapla
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