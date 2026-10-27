import React, { useEffect, useRef } from "react";
import { Keyboard, X } from "lucide-react";

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { key: "Space or K", desc: "Read aloud / Pause / Resume speech" },
  { key: "Esc", desc: "Stop speech immediately or close dialog" },
  { key: "U", desc: "Jump to photo upload area" },
  { key: "/", desc: "Jump to follow-up question input" },
  { key: "H", desc: "Toggle high-contrast mode (yellow on black)" },
  { key: "T", desc: "Cycle text size (Normal, Large, Extra Large)" },
  { key: "?", desc: "Open or close this shortcuts guide" },
];

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      closeButtonRef.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
      onClick={onClose}
    >
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2 id="shortcuts-title" className="card-title" style={{ margin: 0 }}>
            <Keyboard size={22} aria-hidden="true" color="var(--accent-hover)" />
            Keyboard shortcuts
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            className="btn-secondary"
            onClick={onClose}
            aria-label="Close keyboard shortcuts dialog"
            style={{ minHeight: "36px", padding: "0.25rem 0.65rem" }}
          >
            <X size={18} aria-hidden="true" />
            <span className="sr-only">Close</span>
          </button>
        </div>

        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {SHORTCUTS.map((item, idx) => (
            <li
              key={idx}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0.5rem 0.75rem",
                backgroundColor: "var(--bg-surface-elevated)",
                borderRadius: "6px",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <span style={{ color: "var(--text-primary)", fontSize: "0.95rem" }}>{item.desc}</span>
              <kbd
                style={{
                  fontFamily: "monospace",
                  backgroundColor: "var(--bg-surface)",
                  color: "var(--accent-hover)",
                  padding: "0.2rem 0.5rem",
                  borderRadius: "4px",
                  border: "1px solid var(--border-strong)",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                }}
              >
                {item.key}
              </kbd>
            </li>
          ))}
        </ul>

        <div style={{ marginTop: "1.25rem", textAlign: "right" }}>
          <button type="button" className="btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
