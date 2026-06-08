import { useEffect, useState } from "react";
import { apiClient } from "../api/client";
import "./RangeSelector.css";

export default function RangeSelector({
  startRow,
  endRow,
  onStartChange,
  onEndChange,
  disabled = false,
}) {
  const [totalCount, setTotalCount] = useState(null);

  useEffect(() => {
    apiClient.getDataCount()
      .then((res) => setTotalCount(res.count))
      .catch(() => setTotalCount(null));
  }, []);

  const willFetch = Math.max(0, endRow - startRow + 1);
  const isValid   = startRow >= 1 && endRow >= startRow;
  const overLimit = totalCount && endRow > totalCount;
  const status    = !isValid ? "invalid" : overLimit ? "warn" : "ok";

  return (
    <>
      <label className="rangeField">
        <span className="rangeLabel">Başlangıç Satırı</span>
        <input
          type="number"
          min="1"
          max={totalCount || 999999}
          value={startRow}
          onChange={(e) => onStartChange(Math.max(1, Number(e.target.value)))}
          disabled={disabled}
        />
      </label>

      <div className="rangeDash">—</div>

      <label className="rangeField">
        <span className="rangeLabel">Bitiş Satırı</span>
        <input
          type="number"
          min={startRow}
          max={totalCount || 999999}
          value={endRow}
          onChange={(e) => onEndChange(Math.max(startRow, Number(e.target.value)))}
          disabled={disabled}
        />
      </label>

      <div className={`rangePreview ${status}`}>
        {!isValid ? (
          <span>Geçersiz aralık</span>
        ) : (
          <>
            <span className="previewCount">{willFetch.toLocaleString("tr-TR")}</span>
            <span className="previewUnit"> kayıt</span>
            {totalCount && (
              <span className="previewTotal">
                {overLimit
                  ? ` · max ${totalCount.toLocaleString("tr-TR")}`
                  : ` / ${totalCount.toLocaleString("tr-TR")}`}
              </span>
            )}
          </>
        )}
      </div>
    </>
  );
}
