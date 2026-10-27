import React from "react";

interface AudioPulseProps {
  isSpeaking: boolean;
  isPaused: boolean;
}

export const AudioPulse: React.FC<AudioPulseProps> = ({ isSpeaking, isPaused }) => {
  if (!isSpeaking && !isPaused) return null;

  return (
    <div
      className="audio-pulse-container"
      role="status"
      aria-label={isPaused ? "Audio playback is paused" : "Audio is actively playing"}
      title={isPaused ? "Audio paused" : "Speaking aloud"}
    >
      <div className={`audio-pulse-bar bar-1 ${isSpeaking && !isPaused ? "active" : "paused"}`} />
      <div className={`audio-pulse-bar bar-2 ${isSpeaking && !isPaused ? "active" : "paused"}`} />
      <div className={`audio-pulse-bar bar-3 ${isSpeaking && !isPaused ? "active" : "paused"}`} />
      <div className={`audio-pulse-bar bar-4 ${isSpeaking && !isPaused ? "active" : "paused"}`} />
      <span className="audio-pulse-label">
        {isPaused ? "Paused" : "Speaking"}
      </span>
    </div>
  );
};
