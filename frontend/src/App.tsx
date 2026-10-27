import React, { useState, useEffect, useCallback, useRef } from "react";
import { Header } from "./components/Header";
import { PrivacyBanner } from "./components/PrivacyBanner";
import { PhotoUploader } from "./components/PhotoUploader";
import { DescriptionView } from "./components/DescriptionView";
import { FollowUpChat } from "./components/FollowUpChat";
import { StickyAudioBar } from "./components/StickyAudioBar";
import { ShortcutsModal } from "./components/ShortcutsModal";
import { useSpeech } from "./hooks/useSpeech";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { audioCues } from "./utils/audioCues";
import { fetchHealth, describePhoto, sendChatMessage } from "./services/api";
import {
  HealthStatus,
  DescribeResponse,
  DescriptionMode,
  ChatMessage,
  TextScale,
  ThemeMode,
} from "./types";
import { AlertCircle, RefreshCw } from "lucide-react";

export const App: React.FC = () => {
  // Application State
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [checkingHealth, setCheckingHealth] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mode, setMode] = useState<DescriptionMode>("concise");

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [describeResult, setDescribeResult] = useState<DescribeResponse | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatting, setIsChatting] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  // Accessibility Preferences
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [fontScale, setFontScale] = useState<TextScale>("normal");
  const [accessibleFont, setAccessibleFont] = useState(false);
  const [enhancedSpacing, setEnhancedSpacing] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  // Screen Reader Live Announcements
  const [liveAnnouncement, setLiveAnnouncement] = useState("");
  const [alertAnnouncement, setAlertAnnouncement] = useState("");

  const speech = useSpeech();
  const descriptionRef = useRef<HTMLDivElement | null>(null);

  // Announcer helpers
  const announcePolite = useCallback((msg: string) => {
    setLiveAnnouncement("");
    setTimeout(() => setLiveAnnouncement(msg), 50);
  }, []);

  const announceAssertive = useCallback((msg: string) => {
    setAlertAnnouncement("");
    setTimeout(() => setAlertAnnouncement(msg), 50);
  }, []);

  // Sync theme, font family, font size, and spacing to document body
  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
    document.body.setAttribute("data-contrast", theme === "high-contrast" ? "high-contrast" : "standard");
  }, [theme]);

  useEffect(() => {
    document.body.setAttribute("data-font-size", fontScale);
  }, [fontScale]);

  useEffect(() => {
    document.body.setAttribute("data-font-family", accessibleFont ? "accessible" : "default");
  }, [accessibleFont]);

  useEffect(() => {
    document.body.setAttribute("data-spacing", enhancedSpacing ? "enhanced" : "normal");
  }, [enhancedSpacing]);

  const handleToggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      audioCues.setSoundEnabled(next);
      announcePolite(next ? "Audio cues enabled" : "Audio cues muted");
      return next;
    });
  }, [announcePolite]);

  const handleCycleTheme = useCallback(() => {
    setTheme((curr) => {
      const next: ThemeMode =
        curr === "light" ? "dark" : curr === "dark" ? "high-contrast" : "light";
      announcePolite(`Theme changed to ${next}`);
      return next;
    });
  }, [announcePolite]);

  const handleCycleFontScale = useCallback(() => {
    setFontScale((curr) => {
      const next: TextScale = curr === "normal" ? "large" : curr === "large" ? "xlarge" : "normal";
      announcePolite(`Text size set to ${next}`);
      return next;
    });
  }, [announcePolite]);

  const handleToggleAccessibleFont = useCallback(() => {
    setAccessibleFont((prev) => {
      const next = !prev;
      announcePolite(next ? "High-legibility font enabled" : "Standard font restored");
      return next;
    });
  }, [announcePolite]);

  const handleToggleEnhancedSpacing = useCallback(() => {
    setEnhancedSpacing((prev) => {
      const next = !prev;
      announcePolite(next ? "Enhanced text spacing enabled" : "Standard text spacing restored");
      return next;
    });
  }, [announcePolite]);

  // Load backend and LM Studio health
  const checkServerHealth = useCallback(async () => {
    setCheckingHealth(true);
    try {
      const status = await fetchHealth();
      setHealth(status);
      if (!status.connected) {
        announceAssertive("LM Studio is offline at " + status.base_url);
      } else if (!status.model_available) {
        announceAssertive(`Model ${status.configured_model} is not loaded in LM Studio.`);
      } else {
        announcePolite("Local AI ready.");
      }
    } catch {
      announceAssertive("Unable to connect to backend server.");
    } finally {
      setCheckingHealth(false);
    }
  }, [announcePolite, announceAssertive]);

  useEffect(() => {
    checkServerHealth();
  }, [checkServerHealth]);

  // File selection
  const handleFileSelect = (file: File) => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    const url = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(url);
    setDescribeResult(null);
    setAnalysisError(null);
    setChatHistory([]);
    setChatError(null);

    // Read image dimensions to announce aspect ratio to VoiceOver
    const probe = new Image();
    probe.onload = () => {
      const orient = probe.width > probe.height ? "landscape" : probe.height > probe.width ? "portrait" : "square";
      announcePolite(`Photo selected: ${file.name}, ${orient} framing, ${probe.width} by ${probe.height} pixels.`);
    };
    probe.onerror = () => {
      announcePolite(`Photo selected: ${file.name}.`);
    };
    probe.src = url;

    audioCues.playUploadChime();
  };

  // Remove photo
  const handleRemovePhoto = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    speech.stop();
    setSelectedFile(null);
    setPreviewUrl(null);
    setDescribeResult(null);
    setAnalysisError(null);
    setChatHistory([]);
    setChatError(null);
    announcePolite("Photo removed.");
  };

  // Analyze Photo
  const handleAnalyzePhoto = async () => {
    if (!selectedFile) return;

    speech.stop();
    setIsAnalyzing(true);
    setAnalysisError(null);
    announcePolite("Describing photo with local model...");

    try {
      const result = await describePhoto(selectedFile, mode);
      setDescribeResult(result);
      audioCues.playSuccessChime();
      announcePolite("Description ready.");

      setTimeout(() => {
        descriptionRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err: any) {
      const errorMsg =
        err.message || "Failed to analyze photo. Please verify LM Studio is running.";
      setAnalysisError(errorMsg);
      audioCues.playErrorTone();
      announceAssertive(`Analysis error: ${errorMsg}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Follow-up Chat Question
  const handleSendChatMessage = async (question: string) => {
    if (!describeResult?.image_data_url) return;

    speech.stop();
    setChatError(null);
    setIsChatting(true);

    const userTurn: ChatMessage = { role: "user", content: question };
    const updatedHistory = [...chatHistory, userTurn];
    setChatHistory(updatedHistory);
    announcePolite("Question submitted. Checking photo...");

    try {
      const res = await sendChatMessage(
        describeResult.image_data_url,
        question,
        chatHistory
      );
      const assistantTurn: ChatMessage = { role: "assistant", content: res.response };
      setChatHistory([...updatedHistory, assistantTurn]);
      audioCues.playSuccessChime();
      announcePolite(`Answer received: ${res.response}`);
    } catch (err: any) {
      const errorMsg = err.message || "Could not retrieve answer.";
      setChatError(errorMsg);
      audioCues.playErrorTone();
      announceAssertive(`Follow-up error: ${errorMsg}`);
    } finally {
      setIsChatting(false);
    }
  };

  // Keyboard shortcut handlers
  const handleTogglePlayPause = useCallback(() => {
    if (!speech.isSpeaking) {
      if (describeResult?.description) {
        speech.speak(describeResult.description);
      }
    } else if (speech.isPaused) {
      speech.resume();
    } else {
      speech.pause();
    }
  }, [speech, describeResult]);

  const handleStopSpeech = useCallback(() => {
    if (isShortcutsOpen) {
      setIsShortcutsOpen(false);
      return;
    }
    speech.stop();
  }, [isShortcutsOpen, speech]);

  const handleFocusUpload = useCallback(() => {
    const el = document.getElementById("uploader-section");
    el?.scrollIntoView({ behavior: "smooth" });
    const dropzone = el?.querySelector('[role="button"]') as HTMLElement;
    dropzone?.focus();
  }, []);

  const handleFocusChat = useCallback(() => {
    const input = document.getElementById("follow-up-input") as HTMLInputElement;
    if (input) {
      input.focus();
      input.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  useKeyboardShortcuts({
    onTogglePlayPause: handleTogglePlayPause,
    onStop: handleStopSpeech,
    onFocusUpload: handleFocusUpload,
    onFocusChat: handleFocusChat,
    onToggleShortcutsModal: () => setIsShortcutsOpen((prev) => !prev),
    onToggleContrast: handleCycleTheme,
    onCycleFontScale: handleCycleFontScale,
  });

  return (
    <div className="app-container">
      {/* Skip Link for Keyboard Navigation */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Screen Reader Live Regions */}
      <div className="sr-only" role="status" aria-live="polite">
        {liveAnnouncement}
      </div>
      <div className="sr-only" role="alert" aria-live="assertive">
        {alertAnnouncement}
      </div>

      {/* Header */}
      <Header
        health={health}
        checkingHealth={checkingHealth}
        onRefreshHealth={checkServerHealth}
        theme={theme}
        onChangeTheme={setTheme}
        fontScale={fontScale}
        onChangeFontScale={setFontScale}
        accessibleFont={accessibleFont}
        onToggleAccessibleFont={handleToggleAccessibleFont}
        enhancedSpacing={enhancedSpacing}
        onToggleEnhancedSpacing={handleToggleEnhancedSpacing}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
      />

      {/* Main Content Landmark */}
      <main id="main-content" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        <PrivacyBanner health={health} />

        <PhotoUploader
          selectedFile={selectedFile}
          previewUrl={previewUrl}
          mode={mode}
          isAnalyzing={isAnalyzing}
          onFileSelect={handleFileSelect}
          onRemovePhoto={handleRemovePhoto}
          onChangeMode={setMode}
          onAnalyze={handleAnalyzePhoto}
        />

        {analysisError && (
          <div className="alert-banner error" role="alert">
            <AlertCircle size={22} aria-hidden="true" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <h4 style={{ fontWeight: 700, marginBottom: "0.25rem" }}>Analysis error</h4>
              <p style={{ marginBottom: "0.75rem" }}>{analysisError}</p>
              <button
                type="button"
                className="btn-primary"
                onClick={handleAnalyzePhoto}
                disabled={isAnalyzing}
                style={{ minHeight: "38px", padding: "0.35rem 0.85rem" }}
              >
                <RefreshCw size={16} aria-hidden="true" />
                <span>Retry</span>
              </button>
            </div>
          </div>
        )}

        {describeResult && (
          <div ref={descriptionRef}>
            <DescriptionView
              data={describeResult}
              speech={speech}
              onRegenerate={handleAnalyzePhoto}
              isAnalyzing={isAnalyzing}
            />
          </div>
        )}

        {describeResult && (
          <FollowUpChat
            imageDataUrl={describeResult.image_data_url}
            history={chatHistory}
            onSendMessage={handleSendChatMessage}
            isSending={isChatting}
            speech={speech}
            chatError={chatError}
            onClearError={() => setChatError(null)}
          />
        )}
      </main>

      {/* Sticky Bottom Audio Player Bar */}
      <StickyAudioBar
        speech={speech}
        activeText={describeResult?.description || null}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
      />

      {/* Keyboard Shortcuts Dialog */}
      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* Footer Landmark */}
      <footer
        role="contentinfo"
        style={{
          marginTop: "3rem",
          paddingTop: "1.5rem",
          borderTop: "1.5px solid var(--border-subtle)",
          color: "var(--text-muted)",
          fontSize: "0.875rem",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1rem",
        }}
      >
        <p>
          <strong>ZoodSle</strong> • Local accessibility tool (Press ? for keyboard shortcuts)
        </p>
        <p>
          Model: <code>{health?.configured_model || "qwen/qwen3-vl-4b"}</code> • Web Speech API
        </p>
      </footer>
    </div>
  );
};

export default App;
