import React from "react";
import { Volume2, VolumeX, Pause, Play, Bell, BellOff } from "lucide-react";
import { SpeechControl } from "../hooks/useSpeech";
import { AudioPulse } from "./AudioPulse";

interface StickyAudioBarProps {
  speech: SpeechControl;
  activeText: string | null;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const StickyAudioBar: React.FC<StickyAudioBarProps> = ({
  speech,
  activeText,
  soundEnabled,
  onToggleSound,
}) => {
  const { isSpeaking, isPaused, rate, voices, selectedVoice } = speech;

  // Show if speech is active or there is text available to speak
  if (!activeText && !isSpeaking && !isPaused) {
    return null;
  }

  const handleMainAction = () => {
    if (!isSpeaking) {
      if (activeText) {
        speech.speak(activeText);
      }
    } else if (isPaused) {
      speech.resume();
    } else {
      speech.pause();
    }
  };

  return (
    <aside
      className="sticky-audio-bar"
      role="region"
      aria-label="Floating audio speech player"
    >
      <div className="sticky-audio-inner">
        {/* Left: Play/Pause/Resume and Stop */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <button
            type="button"
            className="btn-primary"
            onClick={handleMainAction}
            aria-label={
              !isSpeaking
                ? "Read current description aloud"
                : isPaused
                ? "Resume speech"
                : "Pause speech"
            }
            title={
              !isSpeaking
                ? "Read aloud (Space or K)"
                : isPaused
                ? "Resume (Space or K)"
                : "Pause (Space or K)"
            }
            style={{ minHeight: "42px", padding: "0.4rem 1rem" }}
          >
            {!isSpeaking ? (
              <>
                <Volume2 size={18} aria-hidden="true" />
                <span>Read aloud</span>
              </>
            ) : isPaused ? (
              <>
                <Play size={18} aria-hidden="true" />
                <span>Resume</span>
              </>
            ) : (
              <>
                <Pause size={18} aria-hidden="true" />
                <span>Pause</span>
              </>
            )}
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={speech.stop}
            disabled={!isSpeaking && !isPaused}
            aria-label="Stop reading (Escape)"
            title="Stop reading (Escape)"
            style={{ minHeight: "42px", padding: "0.4rem 0.85rem" }}
          >
            <VolumeX size={18} aria-hidden="true" />
            <span className="sr-only">Stop</span>
          </button>
        </div>

        {/* Center: Audio Pulse Waveform */}
        <AudioPulse isSpeaking={isSpeaking} isPaused={isPaused} />

        {/* Right: Speed, Voice, Sound Cue controls */}
        <div className="sticky-audio-settings">
          <label htmlFor="sticky-speech-rate" className="sr-only">
            Speed
          </label>
          <select
            id="sticky-speech-rate"
            className="speed-select"
            value={rate}
            onChange={(e) => speech.setRate(parseFloat(e.target.value))}
            aria-label="Playback speed"
            title="Playback speed"
            style={{ minHeight: "38px", padding: "0.2rem 0.5rem" }}
          >
            <option value="0.75">0.75x</option>
            <option value="1.0">1.0x</option>
            <option value="1.25">1.25x</option>
            <option value="1.5">1.5x</option>
            <option value="1.75">1.75x</option>
          </select>

          <select
            id="sticky-speech-pitch"
            className="speed-select hide-on-mobile"
            value={speech.pitch}
            onChange={(e) => speech.setPitch(parseFloat(e.target.value))}
            aria-label="Voice pitch"
            title="Voice pitch (frequency)"
            style={{ minHeight: "38px", padding: "0.2rem 0.5rem" }}
          >
            <option value="0.8">Lower pitch</option>
            <option value="1.0">Normal pitch</option>
            <option value="1.2">Higher pitch</option>
          </select>

          {voices.length > 0 && (
            <select
              className="voice-select hide-on-mobile"
              value={selectedVoice?.name || ""}
              onChange={(e) => {
                const v = voices.find((item) => item.name === e.target.value);
                speech.setSelectedVoice(v || null);
              }}
              aria-label="Voice"
              title="Speech voice"
              style={{ minHeight: "38px", padding: "0.2rem 0.5rem", maxWidth: "160px" }}
            >
              {voices.map((v) => (
                <option key={v.name} value={v.name}>
                  {v.name}
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            className="btn-secondary"
            onClick={onToggleSound}
            aria-label={soundEnabled ? "Mute audio cues" : "Unmute audio cues"}
            title={soundEnabled ? "Audio cues enabled" : "Audio cues muted"}
            style={{ minHeight: "38px", padding: "0.3rem 0.6rem" }}
          >
            {soundEnabled ? (
              <Bell size={16} aria-hidden="true" color="var(--accent-hover)" />
            ) : (
              <BellOff size={16} aria-hidden="true" color="var(--text-muted)" />
            )}
            <span className="sr-only">{soundEnabled ? "Cues on" : "Cues off"}</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
