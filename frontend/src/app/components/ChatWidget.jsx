import { useState, useRef, useEffect } from "react";
import { apiClient } from "../api/client";
import { useDataSource } from "../context/DataSourceContext";
import "./ChatWidget.css";

const SUGGESTIONS = [
  "Bu veri setini özetle",
  "Hangi aktivite en uzun sürüyor?",
  "Inductive ve Heuristics Miner farkı nedir?",
  "Uyumsuz case'ler için ne yapılabilir?",
];

export default function ChatWidget() {
  const { source } = useDataSource();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Merhaba! Süreç madenciliği asistanınım. Analiz sonuçları veya süreç madenciliği hakkında sorularınızı yanıtlayabilirim.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput("");

    const userMsg = { role: "user", content: msg };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const history = messages.map((m) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.content,
      }));
      const res = await apiClient.chat(msg, "", history);
      setMessages((prev) => [...prev, { role: "assistant", content: res.reply }]);
    } catch (err) {
      setMessages((prev) => [
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
    setMessages([
      {
        role: "assistant",
        content: "Sohbet temizlendi. Yeni bir soru sorabilirsiniz.",
      },
    ]);
  };

  const isStart = messages.length <= 1;

  return (
    <div className="chatRoot">
      {open && (
        <div className="chatBox">
          {/* Header */}
          <div className="chatHead">
            <div className="chatHeadInfo">
              <div className="chatHeadAvatar">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                </svg>
              </div>
              <div>
                <div className="chatHeadTitle">AI Asistan</div>
                <div className="chatHeadSub">Gemini · {source.label}</div>
              </div>
            </div>
            <div className="chatHeadBtns">
              <button className="chatHeadBtn" title="Sohbeti temizle" onClick={clearChat}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zm2.46-7.12 1.41-1.41L12 12.59l2.12-2.12 1.41 1.41L13.41 14l2.12 2.12-1.41 1.41L12 15.41l-2.12 2.12-1.41-1.41L10.59 14l-2.13-2.12zM15.5 4l-1-1h-5l-1 1H5v2h14V4z"/>
                </svg>
              </button>
              <button className="chatHeadBtn chatHeadClose" title="Kapat" onClick={() => setOpen(false)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="chatMsgs">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`chatMsg ${m.role === "user" ? "chatMsgUser" : "chatMsgBot"}${m.error ? " chatMsgErr" : ""}`}
              >
                {m.role === "assistant" && (
                  <div className="chatBotAvatar">AI</div>
                )}
                <div className="chatBubble">
                  {m.content.split("\n").map((line, j, arr) => (
                    <span key={j}>
                      {line}
                      {j < arr.length - 1 && <br />}
                    </span>
                  ))}
                </div>
              </div>
            ))}

            {loading && (
              <div className="chatMsg chatMsgBot">
                <div className="chatBotAvatar">AI</div>
                <div className="chatBubble chatTyping">
                  <span /><span /><span />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions */}
          {isStart && (
            <div className="chatSuggs">
              {SUGGESTIONS.map((s) => (
                <button key={s} className="chatSugg" onClick={() => send(s)}>
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
              placeholder="Mesajınızı yazın… (Enter = gönder)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              rows={1}
              disabled={loading}
            />
            <button
              className="chatSendBtn"
              onClick={() => send()}
              disabled={loading || !input.trim()}
              title="Gönder"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        className={`chatFab${open ? " chatFabOpen" : ""}`}
        onClick={() => setOpen((v) => !v)}
        title="AI Asistan"
      >
        {open ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        ) : (
          <>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
            </svg>
            <span className="chatFabLabel">AI Asistan</span>
          </>
        )}
      </button>
    </div>
  );
}
