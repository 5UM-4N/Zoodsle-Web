import { useState, useEffect, useCallback, useRef } from "react";

export interface SpeechControl {
  isSupported: boolean;
  isSpeaking: boolean;
  isPaused: boolean;
  voices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | null;
  rate: number;
  pitch: number;
  setSelectedVoice: (voice: SpeechSynthesisVoice | null) => void;
  setRate: (rate: number) => void;
  setPitch: (pitch: number) => void;
  speak: (text: string) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  statusMessage: string;
}

export function useSpeech(): SpeechControl {
  const isSupported = typeof window !== "undefined" && "speechSynthesis" in window;

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [rate, setRate] = useState<number>(1.0);
  const [pitch, setPitch] = useState<number>(1.0);
  const [statusMessage, setStatusMessage] = useState<string>("Speech ready");

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Load and cache voices
  useEffect(() => {
    if (!isSupported) {
      setStatusMessage("Text-to-speech is not supported by your browser");
      return;
    }

    const updateVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices && availableVoices.length > 0) {
        setVoices(availableVoices);
        // Default to system default or preferred English voice
        const preferred =
          availableVoices.find((v) => v.default && v.lang.startsWith("en")) ||
          availableVoices.find((v) => v.lang.startsWith("en")) ||
          availableVoices[0];
        setSelectedVoice((curr) => curr || preferred);
      }
    };

    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;

    return () => {
      if (isSupported) {
        window.speechSynthesis.cancel();
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, [isSupported]);

  const stop = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
    setStatusMessage("Speech stopped");
  }, [isSupported]);

  const pause = useCallback(() => {
    if (!isSupported) return;
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      setStatusMessage("Speech paused");
    }
  }, [isSupported]);

  const resume = useCallback(() => {
    if (!isSupported) return;
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsSpeaking(true);
      setStatusMessage("Speech resumed");
    }
  }, [isSupported]);

  const speak = useCallback(
    (rawText: string) => {
      if (!isSupported) return;

      // Clean markdown symbols for cleaner audio narration
      const cleanText = rawText
        .replace(/###\s*/g, "")
        .replace(/\*\*/g, "")
        .replace(/[*_~`]/g, "")
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .trim();

      if (!cleanText) return;

      // Cancel any ongoing utterance
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = rate;
      utterance.pitch = pitch;
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
        setIsPaused(false);
        setStatusMessage("Reading description aloud");
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
        setStatusMessage("Speech completed");
      };

      utterance.onerror = (e) => {
        // "interrupted" or "canceled" are standard when stop() is invoked
        if (e.error !== "interrupted" && e.error !== "canceled") {
          console.error("Speech synthesis error:", e);
          setStatusMessage("Speech synthesis encountered an error");
        }
        setIsSpeaking(false);
        setIsPaused(false);
      };

      utterance.onpause = () => {
        setIsPaused(true);
        setStatusMessage("Speech paused");
      };

      utterance.onresume = () => {
        setIsPaused(false);
        setIsSpeaking(true);
        setStatusMessage("Speech resumed");
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [isSupported, rate, pitch, selectedVoice]
  );

  return {
    isSupported,
    isSpeaking,
    isPaused,
    voices,
    selectedVoice,
    rate,
    pitch,
    setSelectedVoice,
    setRate,
    setPitch,
    speak,
    pause,
    resume,
    stop,
    statusMessage,
  };
}
