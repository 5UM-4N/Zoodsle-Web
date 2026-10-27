import React from "react";
import { Eye, RefreshCw, Sun, Moon, Zap, Type, AlignJustify, Keyboard } from "lucide-react";
import { HealthStatus, TextScale, ThemeMode, ContrastTheme } from "../types";

interface HeaderProps {
  health: HealthStatus | null;
  checkingHealth: boolean;
  onRefreshHealth: () => void;
  theme?: ThemeMode;
  onChangeTheme?: (theme: ThemeMode) => void;
  fontScale: TextScale;
  onChangeFontScale: (scale: TextScale) => void;
  accessibleFont?: boolean;
  onToggleAccessibleFont?: () => void;
  enhancedSpacing?: boolean;
  onToggleEnhancedSpacing?: () => void;
  onOpenShortcuts?: () => void;
  // Backwards compatibility for existing test suite
  contrast?: ContrastTheme;
  onToggleContrast?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  health,
  checkingHealth,
  onRefreshHealth,
  theme = "light",
  onChangeTheme,
  fontScale,
  onChangeFontScale,
  accessibleFont = false,
  onToggleAccessibleFont,
  enhancedSpacing = false,
  onToggleEnhancedSpacing,
  onOpenShortcuts,
  contrast,
  onToggleContrast,
}) => {
  const isReady = health?.connected && health?.model_available;
  const isDegraded = health?.connected && !health?.model_available;

  // Active theme resolution
  const currentTheme: ThemeMode = contrast
    ? contrast === "high-contrast"
      ? "high-contrast"
      : "light"
    : theme;

  const cycleTheme = () => {
    if (onToggleContrast) {
      onToggleContrast();
      return;
    }
    if (!onChangeTheme) return;
    const nextTheme: ThemeMode =
      currentTheme === "light"
        ? "dark"
        : currentTheme === "dark"
        ? "high-contrast"
        : "light";
    onChangeTheme(nextTheme);
  };

  return (
    <header className="app-header" role="banner">
      <div className="brand-wrapper">
        <Eye aria-hidden="true" size={30} color="var(--accent-primary)" />
        <div>
          <h1 className="brand-title">ZoodSle</h1>
          <p className="brand-tagline">Local photo assistant for blind and low-vision users</p>
        </div>
      </div>

      <div className="header-toolbar">
        {/* Status indicator */}
        <div
          className="pill-status"
          role="status"
          aria-live="polite"
          title={`Endpoint: ${health?.base_url || "Local"} | Model: ${health?.configured_model || "None"}`}
        >
          <span
            className={`status-dot ${isReady ? "green" : isDegraded ? "amber" : "red"}`}
            aria-hidden="true"
          />
          <span>
            {checkingHealth
              ? "Checking..."
              : isReady
              ? `Ready (${health?.configured_model})`
              : isDegraded
              ? "Model not loaded"
              : "LM Studio offline"}
          </span>
        </div>

        {/* Refresh health */}
        <button
          type="button"
          onClick={onRefreshHealth}
          className="btn-secondary"
          disabled={checkingHealth}
          aria-label="Refresh connection status"
          title="Refresh connection status"
          style={{ minHeight: "38px", padding: "0.3rem 0.65rem" }}
        >
          <RefreshCw
            size={16}
            className={checkingHealth ? "spinner" : ""}
            aria-hidden="true"
          />
          <span className="sr-only">Refresh</span>
        </button>

        {/* Theme mode toggle: Light -> Dark -> High Contrast */}
        <button
          type="button"
          className="btn-secondary"
          onClick={cycleTheme}
          aria-pressed={currentTheme === "high-contrast"}
          aria-label="Toggle high contrast"
          title={`Theme: ${currentTheme}. Click to cycle (Light, Dark, High-Contrast). Shortcut: H`}
          style={{ minHeight: "38px", padding: "0.3rem 0.7rem" }}
        >
          {currentTheme === "light" ? (
            <Sun size={16} aria-hidden="true" />
          ) : currentTheme === "dark" ? (
            <Moon size={16} aria-hidden="true" />
          ) : (
            <Zap size={16} aria-hidden="true" />
          )}
          <span style={{ fontSize: "0.85rem", textTransform: "capitalize" }}>
            {currentTheme === "high-contrast" ? "High contrast on" : currentTheme}
          </span>
        </button>

        {/* Font scaling toggle */}
        <button
          type="button"
          className="btn-secondary"
          onClick={() => {
            const nextScale: TextScale =
              fontScale === "normal" ? "large" : fontScale === "large" ? "xlarge" : "normal";
            onChangeFontScale(nextScale);
          }}
          aria-label={`Text size: ${fontScale}. Click to cycle.`}
          title="Cycle text size (T)"
          style={{ minHeight: "38px", padding: "0.3rem 0.65rem" }}
        >
          <Type size={16} aria-hidden="true" />
          <span style={{ fontSize: "0.85rem", textTransform: "capitalize" }}>
            {fontScale}
          </span>
        </button>

        {/* Dyslexia / Accessible Font Toggle */}
        {onToggleAccessibleFont && (
          <button
            type="button"
            className="btn-secondary"
            onClick={onToggleAccessibleFont}
            aria-pressed={accessibleFont}
            aria-label={accessibleFont ? "Dyslexia font active" : "Enable dyslexia-friendly font"}
            title="Toggle high-legibility dyslexia font"
            style={{ minHeight: "38px", padding: "0.3rem 0.65rem" }}
          >
            <span style={{ fontSize: "0.85rem", fontWeight: 700 }}>
              {accessibleFont ? "Legible: On" : "Legible Font"}
            </span>
          </button>
        )}

        {/* WCAG 1.4.12 Enhanced Spacing Toggle */}
        {onToggleEnhancedSpacing && (
          <button
            type="button"
            className="btn-secondary"
            onClick={onToggleEnhancedSpacing}
            aria-pressed={enhancedSpacing}
            aria-label={enhancedSpacing ? "Enhanced text spacing active" : "Enable wide text spacing (WCAG 1.4.12)"}
            title="Toggle wide line & letter spacing"
            style={{ minHeight: "38px", padding: "0.3rem 0.65rem" }}
          >
            <AlignJustify size={16} aria-hidden="true" />
            <span style={{ fontSize: "0.85rem" }}>
              {enhancedSpacing ? "Wide spacing" : "Spacing"}
            </span>
          </button>
        )}

        {/* Shortcuts Dialog Trigger */}
        {onOpenShortcuts && (
          <button
            type="button"
            className="btn-secondary"
            onClick={onOpenShortcuts}
            aria-label="Keyboard shortcuts"
            title="Keyboard shortcuts (?)"
            style={{ minHeight: "38px", padding: "0.3rem 0.65rem" }}
          >
            <Keyboard size={16} aria-hidden="true" />
            <span className="sr-only">Shortcuts</span>
          </button>
        )}
      </div>
    </header>
  );
};
