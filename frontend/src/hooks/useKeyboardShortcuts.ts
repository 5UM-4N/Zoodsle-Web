import { useEffect } from "react";

interface ShortcutHandlers {
  onTogglePlayPause: () => void;
  onStop: () => void;
  onFocusUpload: () => void;
  onFocusChat: () => void;
  onToggleShortcutsModal: () => void;
  onToggleContrast: () => void;
  onCycleFontScale: () => void;
}

export function useKeyboardShortcuts({
  onTogglePlayPause,
  onStop,
  onFocusUpload,
  onFocusChat,
  onToggleShortcutsModal,
  onToggleContrast,
  onCycleFontScale,
}: ShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        (activeEl instanceof HTMLElement && activeEl.isContentEditable);

      const isButtonOrControl =
        activeEl instanceof HTMLButtonElement ||
        activeEl instanceof HTMLSelectElement ||
        (activeEl instanceof HTMLElement && (
          activeEl.getAttribute("role") === "button" ||
          activeEl.getAttribute("role") === "link" ||
          activeEl.getAttribute("role") === "checkbox" ||
          activeEl.getAttribute("role") === "menuitem" ||
          activeEl.getAttribute("role") === "tab" ||
          activeEl.tagName === "BUTTON" ||
          activeEl.tagName === "SUMMARY"
        ));

      // Global Escape always works (stops speech or closes modals)
      if (e.key === "Escape") {
        onStop();
        return;
      }

      // If user is actively typing in an input, don't trigger letter shortcuts
      if (isInput) {
        return;
      }

      // Don't hijack spacebar when user is activating a focused button or interactive control
      if (e.key === " " && isButtonOrControl) {
        return;
      }

      if (e.key === " " || e.key === "k" || e.key === "K") {
        e.preventDefault();
        onTogglePlayPause();
      } else if (e.key === "u" || e.key === "U") {
        e.preventDefault();
        onFocusUpload();
      } else if (e.key === "/") {
        e.preventDefault();
        onFocusChat();
      } else if (e.key === "?") {
        e.preventDefault();
        onToggleShortcutsModal();
      } else if (e.key === "h" || e.key === "H") {
        e.preventDefault();
        onToggleContrast();
      } else if (e.key === "t" || e.key === "T") {
        e.preventDefault();
        onCycleFontScale();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    onTogglePlayPause,
    onStop,
    onFocusUpload,
    onFocusChat,
    onToggleShortcutsModal,
    onToggleContrast,
    onCycleFontScale,
  ]);
}
