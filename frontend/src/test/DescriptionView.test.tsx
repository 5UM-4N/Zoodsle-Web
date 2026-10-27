import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DescriptionView } from "../components/DescriptionView";
import { DescribeResponse } from "../types";
import { SpeechControl } from "../hooks/useSpeech";

describe("DescriptionView component", () => {
  const mockData: DescribeResponse = {
    description: "A smiling family of three standing on a sunny beach with clear turquoise water in the background.",
    mode: "concise",
    metadata: {
      format: "JPEG",
      mime_type: "image/jpeg",
      width: 1920,
      height: 1080,
      size_bytes: 54321,
      filename: "beach.jpg",
    },
    model: "qwen/qwen3-vl-4b",
    is_local: true,
    privacy_notice: "Local inference",
    image_data_url: "data:image/jpeg;base64,123",
  };

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

  it("renders description text and image metadata", () => {
    render(
      <DescriptionView
        data={mockData}
        speech={mockSpeech}
        onRegenerate={vi.fn()}
        isAnalyzing={false}
      />
    );

    expect(screen.getByText(/A smiling family of three standing on a sunny beach/i)).toBeInTheDocument();
    expect(screen.getByText("qwen/qwen3-vl-4b")).toBeInTheDocument();
    expect(screen.getByText("JPEG • 1920×1080px")).toBeInTheDocument();
  });

  it("triggers speak when Read Aloud button is clicked", () => {
    const speakMock = vi.fn();
    render(
      <DescriptionView
        data={mockData}
        speech={{ ...mockSpeech, speak: speakMock }}
        onRegenerate={vi.fn()}
        isAnalyzing={false}
      />
    );

    const playBtn = screen.getByRole("button", { name: /Read description aloud/i });
    fireEvent.click(playBtn);
    expect(speakMock).toHaveBeenCalledWith(mockData.description);
  });
});
