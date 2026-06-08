import { useState, useRef, useEffect } from "react";
import { apiClient } from "../api/client";
import "./ChatWidget.css";

const SUGGESTIONS = [
  "Bu veri setini özetle",
  "Hangi aktivite en fazla darboğaz yaratıyor?",
  "Inductive ve Heuristics Miner farkı nedir?",
  "Uyumsuz case'ler için ne yapılabilir?",
];

export default function ChatWidget() {
  const [open, setOpen]       = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Merhaba! Ben süreç madenciliği asistanınım. Analiz sonuçlarınızı yapıştırabilir ya da doğrudan soru sorabilirsiniz.",
    },
  ]);
  const [input, setInput]     = useState("");
  const [context, setContext] = useState("");
  const [showCtx, setShowCtx] = useState(false);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput("");

    const userMsg = { role: "user", content: msg };
    const history = messages.filter(m => m.role !== "assistant" || messages.indexOf(m) > 0);

    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const geminiHistory = history.map(m => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.content,
      }));
      const res = await apiClient.chat(msg, context, geminiHistory);
      setMessages(prev => [...prev, { role: "assistant", content: res.reply }]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: `Hata: ${err.message}`, error: true },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const clearChat = () => {
    setMessages([{
      role: "assistant",
      content: "Sohbet temizlendi. Yeni bir soru sorabilirsiniz.",
    }]);
    setContext("");
    setShowCtx(false);
  };

  return (
    <div className="chatWidgetRoot">
      {/* Popup */}
      {open && (
        <div className="chatPopup">
          {/* Header */}
          <div className="chatHeader">
            <div className="chatHeaderLeft">
              <div className="chatAvatar">AI</div>
              <div>
                <div className="chatTitle">Süreç Asistanı</div>
                <div className="chatSubtitle">Gemini · BPI 2012</div>
              </div>
            </div>
            <div className="chatHeaderActions">
              <button className="chatIconBtn" title="Sohbeti temizle" onClick={clearChat}>✕</button>
              <button className="chatIconBtn" onClick={() => setOpen(false)}>−</button>
            </div>
          </div>

          {/* Context banner */}
          <div className="chatContextBar">
            <button
              className={`chatCtxToggle ${context ? "chatCtxActive" : ""}`}
              onClick={() => setShowCtx(v => !v)}
            >
              {context ? "📎 Bağlam eklendi" : "+ Analiz sonucu yapıştır"}
            </button>
            {context && (
              <button className="chatCtxClear" onClick={() => setContext("")}>Kaldır</button>
            )}
          </div>

          {showCtx && (
            <div className="chatCtxArea">
              <textarea
                className="chatCtxInput"
                placeholder="Sekmedeki analiz sonuçlarını buraya kopyalayın (tablo, metrik değerleri vb.)…"
                value={context}
                onChange={e => setContext(e.target.value)}
                rows={4}
              />
              <button className="chatCtxSave" onClick={() => setShowCtx(false)}>
                Kaydet ve Kapat
              </button>
            </div>
          )}

          {/* Messages */}
          <div className="chatMessages">
            {messages.map((m, i) => (
              <div key={i} className={`chatMsg ${m.role === "user" ? "chatMsgUser" : "chatMsgBot"} ${m.error ? "chatMsgError" : ""}`}>
                {m.role === "assistant" && <div className="chatMsgAvatar">AI</div>}
                <div className="chatMsgBubble">
                  {m.content.split("\n").map((line, j) => (
                    <span key={j}>{line}{j < m.content.split("\n").length - 1 && <br />}</span>
                  ))}
                </div>
              </div>
            ))}
            {loading && (
              <div className="chatMsg chatMsgBot">
                <div className="chatMsgAvatar">AI</div>
                <div className="chatMsgBubble chatTyping">
                  <span /><span /><span />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions (only at start) */}
          {messages.length <= 1 && (
            <div className="chatSuggestions">
              {SUGGESTIONS.map(s => (
                <button key={s} className="chatSuggestion" onClick={() => send(s)}>
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="chatInputRow">
            <textarea
              ref={inputRef}
              className="chatInput"
              placeholder="Mesaj yaz… (Enter = gönder, Shift+Enter = satır)"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              rows={1}
              disabled={loading}
            />
            <button
              className="chatSendBtn"
              onClick={() => send()}
              disabled={loading || !input.trim()}
            >
              ➤
            </button>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        className={`chatFab ${open ? "chatFabOpen" : ""}`}
        onClick={() => setOpen(v => !v)}
        title="AI Asistan"
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
          </svg>
        )}
        {!open && <span className="chatFabLabel">AI Asistan</span>}
      </button>
    </div>
  );
}
