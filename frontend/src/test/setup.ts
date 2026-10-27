import "@testing-library/jest-dom";

// Mock Web Speech API for JSDOM testing
class MockSpeechSynthesisUtterance {
  text: string;
  lang: string = "en-US";
  rate: number = 1.0;
  pitch: number = 1.0;
  volume: number = 1.0;
  voice: any = null;
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onpause: (() => void) | null = null;
  onresume: (() => void) | null = null;

  constructor(text: string = "") {
    this.text = text;
  }
}

const mockSpeechSynthesis = {
  speaking: false,
  paused: false,
  pending: false,
  getVoices: () => [
    { name: "Alex", lang: "en-US", default: true },
    { name: "Samantha", lang: "en-US", default: false },
  ],
  speak: (utterance: MockSpeechSynthesisUtterance) => {
    mockSpeechSynthesis.speaking = true;
    mockSpeechSynthesis.paused = false;
    if (utterance.onstart) utterance.onstart();
  },
  cancel: () => {
    mockSpeechSynthesis.speaking = false;
    mockSpeechSynthesis.paused = false;
  },
  pause: () => {
    mockSpeechSynthesis.paused = true;
  },
  resume: () => {
    mockSpeechSynthesis.paused = false;
  },
  onvoiceschanged: null,
};

Object.defineProperty(window, "speechSynthesis", {
  value: mockSpeechSynthesis,
  writable: true,
});

Object.defineProperty(window, "SpeechSynthesisUtterance", {
  value: MockSpeechSynthesisUtterance,
  writable: true,
});

if (typeof window !== "undefined" && window.HTMLElement) {
  window.HTMLElement.prototype.scrollIntoView = () => {};
}

