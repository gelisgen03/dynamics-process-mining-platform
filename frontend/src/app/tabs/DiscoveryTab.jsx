import { useState } from "react";
import { apiClient } from "../api/client";
import "./DiscoveryTab.css";

export default function DiscoveryTab() {
  const [algorithm, setAlgorithm] = useState("inductive");
  const [limit, setLimit] = useState(1000);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleRunDiscovery = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await apiClient.runDiscovery(algorithm, limit, offset);
      setResult(res);
    } catch (err) {
      setError(err.message || "Discovery başarısız");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="discoveryTab">
      {/* Kontrol Paneli */}
      <div className="controlPanel">
        <div className="controlRow">
          <label className="field">
            <span>Algoritma</span>
            <select
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value)}
              disabled={loading}
            >
              <option value="inductive">Inductive (Önerilen)</option>
              <option value="alpha">Alpha</option>
            </select>
          </label>

          <label className="field">
            <span>Veri Sayısı (Records)</span>
            <input
              type="number"
              min="100"
              max="5000"
              step="100"
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              disabled={loading}
            />
            <small className="fieldHelper">100-5000 arası önerilen</small>
          </label>

          <label className="field">
            <span>Offset (Başlangıç)</span>
            <input
              type="number"
              min="0"
              step="100"
              value={offset}
              onChange={(e) => setOffset(Number(e.target.value))}
              disabled={loading}
            />
          </label>

          <button
            className="btnDiscovery"
            onClick={handleRunDiscovery}
            disabled={loading}
          >
            {loading ? "Analiz Yapılıyor..." : "Modeli Üret"}
          </button>
        </div>
      </div>

      {/* Hata Mesajı */}
      {error && <div className="errorBox">{error}</div>}

      {/* Sonuç */}
      {result && (
        <div className="resultPanel">
          <div className="resultHeader">
            <h3>✓ Süreç Modeli Başarıyla Oluşturuldu</h3>
            <div className="resultMeta">
              <span className="badge">{result.algorithm}</span>
              <span className="badge">{result.events_analyzed} olay</span>
            </div>
          </div>

          <div className="modelViewer">
            <img
              src={result.image_url}
              alt="Petri Net Model"
              className="petriNetImage"
            />
            <p className="modelCaption">
              {result.message}
            </p>
          </div>
        </div>
      )}

      {/* Bilgi Paneli */}
      {!result && (
        <div className="infoPanel">
          <h3>💡 Süreç Keşfi (Process Discovery)</h3>
          <p>
            PM4Py tarafından desteklenen <strong>{algorithm}</strong> algoritması
            kullanılarak seçilen veri üzerinde süreç modeli oluşturulacaktır.
          </p>
          <ul>
            <li><strong>Inductive:</strong> Daha hızlı, kompleks süreçler için iyidir</li>
            <li><strong>Alpha:</strong> Basit süreçler için, daha kesin</li>
            <li><strong>Veri Sayısı:</strong> Az veri → hızlı, Çok veri → yavaş</li>
          </ul>
        </div>
      )}
    </div>
  );
}