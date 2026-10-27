import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { StickyAudioBar } from "../components/StickyAudioBar";
import { SpeechControl } from "../hooks/useSpeech";

describe("StickyAudioBar component", () => {
  const mockSpeech: SpeechControl = {
    isSupported: true,
    isSpeaking: false,
    isPaused: false,
    voices: [],
    selectedVoice: null,
    rate: 1.0,
    pitch: 1.0,
    setSelectedVoice: vi.fn(),
    setRate: vi.fn(),
    setPitch: vi.fn(),
    speak: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    stop: vi.fn(),
    statusMessage: "Speech ready",
  };

  it("does not render when no active text and not speaking", () => {
    const { container } = render(
      <StickyAudioBar
        speech={mockSpeech}
        activeText={null}
        soundEnabled={true}
        onToggleSound={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders floating player when active text is available", () => {
    render(
      <StickyAudioBar
        speech={mockSpeech}
        activeText="A picture of a dog in a park."
        soundEnabled={true}
        onToggleSound={vi.fn()}
      />
    );

    expect(screen.getByRole("region", { name: /Floating audio speech player/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Read current description aloud/i })).toBeInTheDocument();
  });

  it("triggers speak when main button is clicked", () => {
    const speakMock = vi.fn();
    render(
      <StickyAudioBar
        speech={{ ...mockSpeech, speak: speakMock }}
        activeText="A picture of a dog in a park."
        soundEnabled={true}
        onToggleSound={vi.fn()}
      />
    );

    const playBtn = screen.getByRole("button", { name: /Read current description aloud/i });
    fireEvent.click(playBtn);
    expect(speakMock).toHaveBeenCalledWith("A picture of a dog in a park.");
  });

  it("toggles audio sound cues when bell button is clicked", () => {
    const toggleSound = vi.fn();
    render(
      <StickyAudioBar
        speech={mockSpeech}
        activeText="A picture of a dog in a park."
        soundEnabled={true}
        onToggleSound={toggleSound}
      />
    );

    const soundBtn = screen.getByRole("button", { name: /Mute audio cues/i });
    fireEvent.click(soundBtn);
    expect(toggleSound).toHaveBeenCalledTimes(1);
  });
});
