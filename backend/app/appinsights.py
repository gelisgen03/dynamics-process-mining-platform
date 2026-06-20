"""
Application Insights bağlayıcısı — canlı D365 Finance & Operations telemetrisi.

BalSoft ortamının LCS Application Insights kaynağından KQL ile telemetri
çekip (case_id, activity, timestamp) olay günlüğüne dönüştürür. Süreç
madenciliği hattının canlı veri kaynağıdır.

Gerçek telemetri yapısı (customEvents tablosu, ~11.7M kayıt) iki minable
süreç içerir:
  • Depo Dalga İşleme  → case = customDimensions.waveId    (Warehouse.* olayları)
  • Toplu İş Yürütme   → case = customDimensions.BatchJobId (Batch* olayları)

Kimlik doğrulama: Application Insights API anahtarı (X-Api-Key başlığı).
.env anahtarları (backend/app/.env):
    APPINSIGHTS_APP_ID   = <Application ID (GUID)>
    APPINSIGHTS_API_KEY  = <read-only API key ("Read telemetry")>
    # ya da App ID'yi connection string'den çözmek için:
    APPINSIGHTS_CONNECTION_STRING = InstrumentationKey=...;ApplicationId=...
"""

import json
import os
import urllib.error
import urllib.request

API_HOST = "https://api.applicationinsights.io"
API_VERSION = "v1"


class AppInsightsError(Exception):
    """Bağlantı / sorgu hatalarını HTTP durum koduyla taşır."""

    def __init__(self, message: str, status: int = 502):
        super().__init__(message)
        self.status = status


# ============================================================
#  SÜREÇ KATALOĞU — gerçek D365 telemetrisinden türetildi
# ============================================================
# Her süreç, customEvents'ten olay günlüğü üreten bir KQL şablonu ve
# genel-bakış (KPI) sorgusu için bir "kapsam" boyutu tanımlar.

PROCESS_CATALOG = {
    "wave": {
        "id": "wave",
        "label": "Depo Dalga İşleme",
        "label_en": "Warehouse Wave Processing",
        "description": "WHS dalga yaşam döngüsü: oluşturma, ayırma, üretim toplama, "
                       "sevkiyat işi ve dalga sonrası adımlar. Vaka = waveId.",
        "case_expr": "tostring(customDimensions.waveId)",
        "name_filter": 'name startswith "Warehouse."',
        "extra_cols": (
            'warehouse = tostring(customDimensions.warehouseId), '
            'legalEntity = tostring(customDimensions.LegalEntity), '
            'status = tostring(customDimensions.waveStatusCurrent)'
        ),
        "scope_expr": "tostring(customDimensions.warehouseId)",
        "scope_label": "Depo",
        "default_days": 30,
    },
    "batch": {
        "id": "batch",
        "label": "Toplu İş Yürütme",
        "label_en": "Batch Job Execution",
        "description": "Batch iş ve görevlerinin durum geçişleri: oluşturma, "
                       "başlatma, tamamlama/başarısızlık. Vaka = BatchJobId.",
        "case_expr": "tostring(customDimensions.BatchJobId)",
        "name_filter": 'name startswith "Batch"',
        "extra_cols": (
            'status = tostring(customDimensions.NewStatus), '
            'className = tostring(customDimensions.ClassName)'
        ),
        "scope_expr": "tostring(customDimensions.ClassName)",
        "scope_label": "Sınıf",
        "default_days": 7,
    },
}

# Serbest KQL modu için varsayılan (dalga süreci).
DEFAULT_KQL = (
    'customEvents\n'
    '| where timestamp > ago(30d)\n'
    '| where name startswith "Warehouse."\n'
    '| extend case_id = tostring(customDimensions.waveId)\n'
    '| where isnotempty(case_id)\n'
    '| project case_id, activity = name, timestamp\n'
    '| order by case_id asc, timestamp asc\n'
    '| take 5000'
)


def list_processes() -> list:
    """Katalogdaki süreçlerin kullanıcıya açık meta verisini döndürür."""
    return [
        {
            "id": p["id"],
            "label": p["label"],
            "label_en": p["label_en"],
            "description": p["description"],
            "scope_label": p["scope_label"],
            "default_days": p["default_days"],
        }
        for p in PROCESS_CATALOG.values()
    ]


def _process(process_id: str) -> dict:
    p = PROCESS_CATALOG.get(process_id)
    if not p:
        raise AppInsightsError(f"Bilinmeyen süreç: {process_id}", status=400)
    return p


def build_log_kql(process_id: str, days: int, case_limit: int = 300,
                  per_case: int = 120, event_cap: int = 40000) -> str:
    """
    Bir süreç için olay günlüğü üreten KQL'i kurar.

    1) EN GÜNCEL `case_limit` adet benzersiz vakayı seçer.
    2) Her vakanın İLK `per_case` olayını alır (partition) — böylece birkaç dev
       vaka (ör. 6000+ olaylı dalga) örneklemi ele geçirip varyant/performans
       analizini bozmaz; bunun yerine çok sayıda çeşitli vaka gelir.
    """
    p = _process(process_id)
    return (
        f"let cases = customEvents\n"
        f"| where timestamp > ago({int(days)}d)\n"
        f"| where {p['name_filter']}\n"
        f"| extend case_id = {p['case_expr']}\n"
        f"| where isnotempty(case_id)\n"
        f"| summarize lastSeen = max(timestamp) by case_id\n"
        f"| top {int(case_limit)} by lastSeen desc\n"
        f"| project case_id;\n"
        f"customEvents\n"
        f"| where timestamp > ago({int(days)}d)\n"
        f"| where {p['name_filter']}\n"
        f"| extend case_id = {p['case_expr']}\n"
        f"| where case_id in (cases)\n"
        f"| project case_id, activity = name, timestamp, {p['extra_cols']}\n"
        f"| sort by case_id asc, timestamp asc\n"
        f"| extend _rn = row_number(1, prev(case_id) != case_id)\n"
        f"| where _rn <= {int(per_case)}\n"
        f"| project-away _rn\n"
        f"| take {int(event_cap)}"
    )


def build_overview_kql(process_id: str, days: int) -> str:
    """Genel-bakış KPI'larını tek satırda döndüren KQL."""
    p = _process(process_id)
    return (
        f"customEvents\n"
        f"| where timestamp > ago({int(days)}d)\n"
        f"| where {p['name_filter']}\n"
        f"| extend case_id = {p['case_expr']}\n"
        f"| where isnotempty(case_id)\n"
        f"| summarize events = count(), cases = dcount(case_id), "
        f"activities = dcount(name), scope = dcount({p['scope_expr']}), "
        f"tmin = min(timestamp), tmax = max(timestamp)"
    )


def build_slowest_forms_kql(days: int, top: int = 15) -> str:
    """
    En yavaş D365 formları: pageViews tablosundan form (name) başına yükleme
    süresi (duration, ms) istatistikleri. Süreçten bağımsız performans görünümü.
    """
    return (
        f"pageViews\n"
        f"| where timestamp > ago({int(days)}d)\n"
        f"| where isnotempty(name)\n"
        f"| summarize calls = count(), avg_ms = avg(duration), "
        f"p95_ms = percentile(duration, 95), max_ms = max(duration) by form = name\n"
        f"| top {int(top)} by avg_ms desc"
    )


def build_activities_kql(process_id: str, days: int, top: int = 12) -> str:
    """En sık aktiviteleri (olay adlarını) döndüren KQL."""
    p = _process(process_id)
    return (
        f"customEvents\n"
        f"| where timestamp > ago({int(days)}d)\n"
        f"| where {p['name_filter']}\n"
        f"| extend case_id = {p['case_expr']}\n"
        f"| where isnotempty(case_id)\n"
        f"| summarize c = count() by activity = name\n"
        f"| top {int(top)} by c desc"
    )


# ============================================================
#  KİMLİK / YAPILANDIRMA
# ============================================================
def _parse_connection_string(conn: str) -> dict:
    parts = {}
    for chunk in (conn or "").split(";"):
        if "=" in chunk:
            k, _, v = chunk.partition("=")
            parts[k.strip().lower()] = v.strip()
    return parts


def get_config() -> dict:
    app_id = os.getenv("APPINSIGHTS_APP_ID", "").strip()
    api_key = os.getenv("APPINSIGHTS_API_KEY", "").strip()
    conn = os.getenv("APPINSIGHTS_CONNECTION_STRING", "").strip()
    if not app_id and conn:
        app_id = _parse_connection_string(conn).get("applicationid", "")
    return {
        "app_id": app_id,
        "api_key": api_key,
        "has_app_id": bool(app_id),
        "has_api_key": bool(api_key),
        "configured": bool(app_id and api_key),
    }


def status() -> dict:
    """Yapılandırma durumu (gizli değer sızdırmaz)."""
    cfg = get_config()
    if cfg["configured"]:
        message = "Bağlantı yapılandırıldı. Canlı telemetri okunabilir."
    elif cfg["has_app_id"] and not cfg["has_api_key"]:
        message = "Application ID bulundu, API anahtarı eksik. .env'e APPINSIGHTS_API_KEY ekleyin."
    elif cfg["has_api_key"] and not cfg["has_app_id"]:
        message = "API anahtarı bulundu, Application ID eksik. .env'e APPINSIGHTS_APP_ID ekleyin."
    else:
        message = "Yapılandırma yok. .env'e APPINSIGHTS_APP_ID ve APPINSIGHTS_API_KEY ekleyin."
    app_id = cfg["app_id"]
    masked = (app_id[:8] + "…" + app_id[-4:]) if len(app_id) > 12 else app_id
    return {
        "configured": cfg["configured"],
        "app_id_masked": masked,
        "auth_method": "api_key",
        "message": message,
    }


# ============================================================
#  SORGU
# ============================================================
def run_query(kql: str, timeout: int = 90) -> dict:
    """Analytics API'sine KQL gönderir. Dönüş: {"columns":[...], "rows":[[...]]}."""
    cfg = get_config()
    if not cfg["configured"]:
        raise AppInsightsError(
            "Application Insights yapılandırılmamış. .env'de APPINSIGHTS_APP_ID ve "
            "APPINSIGHTS_API_KEY tanımlı olmalı.",
            status=400,
        )
    if not (kql or "").strip():
        raise AppInsightsError("KQL sorgusu boş olamaz.", status=400)

    url = f"{API_HOST}/{API_VERSION}/apps/{cfg['app_id']}/query"
    payload = json.dumps({"query": kql}).encode("utf-8")
    req = urllib.request.Request(
        url, data=payload, method="POST",
        headers={
            "X-Api-Key": cfg["api_key"],
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            body = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", errors="replace")
        try:
            detail = json.loads(detail).get("error", {}).get("message", detail)
        except Exception:
            pass
        if e.code in (401, 403):
            raise AppInsightsError(
                "Kimlik doğrulama başarısız. API anahtarının bu kaynağa "
                "'Read telemetry' iznine sahip olduğundan emin olun.", status=401,
            )
        raise AppInsightsError(f"Application Insights sorgu hatası: {detail}", status=502)
    except urllib.error.URLError as e:
        raise AppInsightsError(f"Application Insights'a ulaşılamadı: {e.reason}", status=502)

    tables = body.get("tables", [])
    if not tables:
        return {"columns": [], "rows": []}
    table = tables[0]
    return {
        "columns": [c["name"] for c in table.get("columns", [])],
        "rows": table.get("rows", []),
    }


def rows_to_dicts(result: dict) -> list:
    """Sütun+satır sonucunu sözlük listesine çevirir."""
    cols = result["columns"]
    return [dict(zip(cols, row)) for row in result["rows"]]


def to_event_log(
    result: dict,
    case_col: str = "case_id",
    activity_col: str = "activity",
    timestamp_col: str = "timestamp",
) -> list:
    """run_query çıktısını [{case_id, activity, timestamp}] listesine eşler."""
    columns = result["columns"]
    idx = {name: i for i, name in enumerate(columns)}
    missing = [c for c in (case_col, activity_col, timestamp_col) if c not in idx]
    if missing:
        raise AppInsightsError(
            f"Sorgu sonucunda beklenen sütun(lar) yok: {', '.join(missing)}. "
            f"Mevcut sütunlar: {', '.join(columns) or '(yok)'}.",
            status=400,
        )
    ci, ai, ti = idx[case_col], idx[activity_col], idx[timestamp_col]
    return [
        {"case_id": row[ci], "activity": row[ai], "timestamp": row[ti]}
        for row in result["rows"]
    ]
