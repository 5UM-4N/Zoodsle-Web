import React, { useState } from "react";
import {
  Volume2,
  VolumeX,
  Pause,
  Play,
  RotateCcw,
  Copy,
  Check,
  FileText,
  Cpu,
} from "lucide-react";
import { DescribeResponse } from "../types";
import { SpeechControl } from "../hooks/useSpeech";

interface DescriptionViewProps {
  data: DescribeResponse;
  speech: SpeechControl;
  onRegenerate: () => void;
  isAnalyzing: boolean;
}

export const DescriptionView: React.FC<DescriptionViewProps> = ({
  data,
  speech,
  onRegenerate,
  isAnalyzing,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(data.description);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const { isSpeaking, isPaused, rate, voices, selectedVoice } = speech;

  return (
    <section className="card" aria-labelledby="description-section-heading">
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
        <h2 id="description-section-heading" className="card-title" style={{ margin: 0 }}>
          <FileText size={22} aria-hidden="true" color="var(--accent-hover)" />
          Description ({data.mode === "detailed" ? "Detailed" : "Short"})
        </h2>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          <span className="pill-status">
            <Cpu size={14} aria-hidden="true" />
            <span>{data.model}</span>
          </span>
          {data.metadata && (
            <span className="pill-status">
              {data.metadata.format} • {data.metadata.width}×{data.metadata.height}px
            </span>
          )}
        </div>
      </div>

      <div className="audio-bar" role="region" aria-label="Audio controls">
        <div className="audio-buttons">
          {!isSpeaking ? (
            <button
              type="button"
              className="btn-primary"
              onClick={() => speech.speak(data.description)}
              aria-label="Read description aloud"
              title="Read description aloud"
            >
              <Volume2 size={18} aria-hidden="true" />
              <span>Read aloud</span>
            </button>
          ) : isPaused ? (
            <button
              type="button"
              className="btn-primary"
              onClick={speech.resume}
              aria-label="Resume reading"
              title="Resume reading"
            >
              <Play size={18} aria-hidden="true" />
              <span>Resume</span>
            </button>
          ) : (
            <button
              type="button"
              className="btn-secondary"
              onClick={speech.pause}
              aria-label="Pause reading"
              title="Pause reading"
            >
              <Pause size={18} aria-hidden="true" />
              <span>Pause</span>
            </button>
          )}

          <button
            type="button"
            className="btn-secondary"
            onClick={speech.stop}
            disabled={!isSpeaking && !isPaused}
            aria-label="Stop reading"
            title="Stop reading"
          >
            <VolumeX size={18} aria-hidden="true" />
            <span>Stop</span>
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={handleCopy}
            aria-label={copied ? "Copied" : "Copy description"}
            title="Copy description"
          >
            {copied ? (
              <>
                <Check size={18} color="#10b981" aria-hidden="true" />
                <span style={{ color: "var(--success-text)" }}>Copied</span>
              </>
            ) : (
              <>
                <Copy size={18} aria-hidden="true" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        <div className="audio-settings">
          <label htmlFor="speech-rate-select" className="sr-only">
            Speed
          </label>
          <select
            id="speech-rate-select"
            className="speed-select"
            value={rate}
            onChange={(e) => speech.setRate(parseFloat(e.target.value))}
            aria-label="Select speed"
            title="Playback speed"
          >
            <option value="0.75">0.75x</option>
            <option value="1.0">1.0x</option>
            <option value="1.25">1.25x</option>
            <option value="1.5">1.5x</option>
            <option value="1.75">1.75x</option>
          </select>

          {voices.length > 0 && (
            <>
              <label htmlFor="voice-picker-select" className="sr-only">
                Voice
              </label>
              <select
                id="voice-picker-select"
                className="voice-select"
                value={selectedVoice?.name || ""}
                onChange={(e) => {
                  const v = voices.find((item) => item.name === e.target.value);
                  speech.setSelectedVoice(v || null);
                }}
                aria-label="Select voice"
                title="System voice"
                style={{ maxWidth: "200px" }}
              >
                {voices.map((v) => (
                  <option key={v.name} value={v.name}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </>
          )}
        </div>
      </div>

      <div className="sr-only" role="status" aria-live="polite">
        {speech.statusMessage}
      </div>

      <div
        className="description-box"
        tabIndex={0}
        role="region"
        aria-label="Description text"
        style={{ marginTop: "1.25rem" }}
      >
        {data.description}
      </div>

      <div style={{ marginTop: "1rem", display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
        <button
          type="button"
          className="btn-secondary"
          onClick={onRegenerate}
          disabled={isAnalyzing}
          aria-label="Regenerate description"
          title="Regenerate description"
        >
          <RotateCcw size={16} aria-hidden="true" />
          <span>Regenerate</span>
        </button>
      </div>
    </section>
  );
};
