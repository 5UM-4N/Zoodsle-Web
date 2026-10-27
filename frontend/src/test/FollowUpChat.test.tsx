import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FollowUpChat } from "../components/FollowUpChat";
import { ChatMessage } from "../types";
import { SpeechControl } from "../hooks/useSpeech";

describe("FollowUpChat component", () => {
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

  const mockHistory: ChatMessage[] = [
    { role: "user", content: "What color is the boat in the background?" },
    { role: "assistant", content: "The boat in the far background is white with a navy blue stripe." },
  ];

  it("renders conversation history and suggested question chips", () => {
    render(
      <FollowUpChat
        imageDataUrl="data:image/jpeg;base64,123"
        history={mockHistory}
        onSendMessage={vi.fn()}
        isSending={false}
        speech={mockSpeech}
        chatError={null}
        onClearError={vi.fn()}
      />
    );

    expect(screen.getByText("What color is the boat in the background?")).toBeInTheDocument();
    expect(
      screen.getByText("The boat in the far background is white with a navy blue stripe.")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Ask: What text is visible\?/i })
    ).toBeInTheDocument();
  });

  it("allows submitting a follow-up question", async () => {
    const sendMock = vi.fn().mockResolvedValue(undefined);

    render(
      <FollowUpChat
        imageDataUrl="data:image/jpeg;base64,123"
        history={[]}
        onSendMessage={sendMock}
        isSending={false}
        speech={mockSpeech}
        chatError={null}
        onClearError={vi.fn()}
      />
    );

    const input = screen.getByPlaceholderText(/e\.g\. What does the sign in the background say\?/i);
    fireEvent.change(input, { target: { value: "Are there trees?" } });

    const sendBtn = screen.getByRole("button", { name: /Send question/i });
    fireEvent.click(sendBtn);

    expect(sendMock).toHaveBeenCalledWith("Are there trees?");
  });
});
