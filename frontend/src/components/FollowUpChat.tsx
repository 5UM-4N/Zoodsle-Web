import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, Volume2, AlertCircle } from "lucide-react";
import { ChatMessage } from "../types";
import { SpeechControl } from "../hooks/useSpeech";

interface FollowUpChatProps {
  imageDataUrl: string | null;
  history: ChatMessage[];
  onSendMessage: (question: string) => Promise<void>;
  isSending: boolean;
  speech: SpeechControl;
  chatError: string | null;
  onClearError: () => void;
}

const SUGGESTED_QUESTIONS = [
  "What text is visible?",
  "What are the main colors?",
  "Describe the layout and background.",
  "What are the people doing?",
  "Are any parts blurry or cropped?",
];

export const FollowUpChat: React.FC<FollowUpChatProps> = ({
  imageDataUrl,
  history,
  onSendMessage,
  isSending,
  speech,
  chatError,
  onClearError,
}) => {
  const [question, setQuestion] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isSending || !imageDataUrl) return;

    const query = question.trim();
    setQuestion("");
    await onSendMessage(query);
  };

  const handleChipClick = (suggested: string) => {
    setQuestion(suggested);
    inputRef.current?.focus();
  };

  useEffect(() => {
    if (history.length > 0 && typeof messagesEndRef.current?.scrollIntoView === "function") {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [history, isSending]);

  if (!imageDataUrl) {
    return null;
  }

  return (
    <section className="card" aria-labelledby="follow-up-heading">
      <h2 id="follow-up-heading" className="card-title">
        <MessageSquare size={22} aria-hidden="true" color="var(--accent-hover)" />
        Ask a follow-up question
      </h2>

      <p style={{ color: "var(--text-secondary)", marginBottom: "0.75rem", fontSize: "0.95rem" }}>
        Ask about details, text, colors, or spatial layout in the photo.
      </p>

      <div>
        <div className="chip-container" role="group" aria-label="Suggested questions">
          {SUGGESTED_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              type="button"
              className="chip-btn"
              onClick={() => handleChipClick(q)}
              disabled={isSending}
              aria-label={`Ask: ${q}`}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {chatError && (
        <div className="alert-banner error" role="alert" style={{ marginTop: "1rem" }}>
          <AlertCircle size={20} aria-hidden="true" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <p>{chatError}</p>
          </div>
          <button
            type="button"
            className="btn-secondary"
            onClick={onClearError}
            style={{ minHeight: "34px", padding: "0.2rem 0.6rem", fontSize: "0.85rem" }}
          >
            Dismiss
          </button>
        </div>
      )}

      {history.length > 0 && (
        <div
          className="chat-thread"
          role="log"
          aria-live="polite"
          aria-label="Conversation history"
        >
          {history.map((msg, idx) => (
            <div
              key={idx}
              className={`chat-bubble ${msg.role}`}
              tabIndex={0}
              role="article"
              aria-label={`${msg.role === "user" ? "Your question" : "Answer"}: ${msg.content}`}
            >
              <div className="chat-bubble-header">
                <span>{msg.role === "user" ? "You" : "Seevia"}</span>
                {msg.role === "assistant" && (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => speech.speak(msg.content)}
                    aria-label="Listen to answer"
                    title="Listen to answer"
                    style={{ minHeight: "32px", padding: "0.2rem 0.6rem", fontSize: "0.825rem" }}
                  >
                    <Volume2 size={15} aria-hidden="true" />
                    <span>Listen</span>
                  </button>
                )}
              </div>
              <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{msg.content}</p>
            </div>
          ))}

          {isSending && (
            <div className="chat-bubble assistant" role="status" aria-live="polite">
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span className="spinner" aria-hidden="true" />
                <span>Checking photo...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="chat-form" aria-label="Ask follow-up question">
        <label htmlFor="follow-up-input" className="sr-only">
          Question
        </label>
        <input
          ref={inputRef}
          type="text"
          id="follow-up-input"
          className="chat-input"
          placeholder="e.g. What does the sign in the background say?"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={isSending}
          aria-required="true"
        />

        <button
          type="submit"
          className="btn-primary"
          disabled={!question.trim() || isSending}
          aria-label="Send question"
          style={{ minWidth: "100px" }}
        >
          {isSending ? (
            <span className="spinner" aria-hidden="true" />
          ) : (
            <>
              <Send size={16} aria-hidden="true" />
              <span>Ask</span>
            </>
          )}
        </button>
      </form>
    </section>
  );
};
