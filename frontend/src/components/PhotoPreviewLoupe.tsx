import React, { useState } from "react";
import { ZoomIn, ZoomOut, RotateCcw, Eye, Trash2 } from "lucide-react";

interface PhotoPreviewLoupeProps {
  previewUrl: string;
  filename: string;
  sizeBytes: number;
  fileType: string;
  isAnalyzing: boolean;
  onRemovePhoto: () => void;
}

type VisualFilter = "none" | "invert" | "high-contrast" | "grayscale";

export const PhotoPreviewLoupe: React.FC<PhotoPreviewLoupeProps> = ({
  previewUrl,
  filename,
  sizeBytes,
  fileType,
  isAnalyzing,
  onRemovePhoto,
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [filter, setFilter] = useState<VisualFilter>("none");

  const handleZoomIn = () => {
    setZoom((curr) => Math.min(curr + 0.5, 3));
  };

  const handleZoomOut = () => {
    setZoom((curr) => Math.max(curr - 0.5, 1));
  };

  const handleReset = () => {
    setZoom(1);
    setFilter("none");
  };

  const getFilterStyle = (): string => {
    switch (filter) {
      case "invert":
        return "invert(100%) hue-rotate(180deg)";
      case "high-contrast":
        return "contrast(180%) brightness(105%)";
      case "grayscale":
        return "grayscale(100%) contrast(120%)";
      default:
        return "none";
    }
  };

  return (
    <div className="preview-container">
      {/* Loupe & Magnifier Controls */}
      <div className="loupe-toolbar" role="toolbar" aria-label="Photo magnification and visual filters">
        <div style={{ display: "flex", gap: "0.35rem", alignItems: "center" }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleZoomIn}
            disabled={zoom >= 3}
            aria-label="Zoom in photograph"
            title="Zoom in (up to 3x)"
            style={{ minHeight: "36px", padding: "0.25rem 0.65rem", fontSize: "0.85rem" }}
          >
            <ZoomIn size={16} aria-hidden="true" />
            <span>+{zoom > 1 ? `${zoom}x` : "Zoom"}</span>
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={handleZoomOut}
            disabled={zoom <= 1}
            aria-label="Zoom out photograph"
            title="Zoom out"
            style={{ minHeight: "36px", padding: "0.25rem 0.65rem", fontSize: "0.85rem" }}
          >
            <ZoomOut size={16} aria-hidden="true" />
            <span>-</span>
          </button>

          {(zoom > 1 || filter !== "none") && (
            <button
              type="button"
              className="btn-secondary"
              onClick={handleReset}
              aria-label="Reset zoom and filters"
              title="Reset view"
              style={{ minHeight: "36px", padding: "0.25rem 0.65rem", fontSize: "0.85rem" }}
            >
              <RotateCcw size={14} aria-hidden="true" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Visual Accessibility Filters Dropdown */}
        <div style={{ display: "flex", gap: "0.35rem", alignItems: "center" }}>
          <label htmlFor="loupe-filter-select" className="sr-only">
            Image filter
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <Eye size={16} aria-hidden="true" color="var(--accent-hover)" />
            <select
              id="loupe-filter-select"
              className="speed-select"
              value={filter}
              onChange={(e) => setFilter(e.target.value as VisualFilter)}
              aria-label="Visual filter for photo"
              title="Low-vision visual filter"
              style={{ minHeight: "36px", padding: "0.2rem 0.6rem", fontSize: "0.85rem" }}
            >
              <option value="none">Normal colors</option>
              <option value="invert">Inverted colors</option>
              <option value="high-contrast">High contrast</option>
              <option value="grayscale">Grayscale</option>
            </select>
          </div>
        </div>
      </div>

      {/* Image Viewport with Pan / Zoom */}
      <div
        className="preview-viewport"
        style={{
          overflow: zoom > 1 ? "auto" : "hidden",
          maxHeight: "420px",
          width: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          borderRadius: "8px",
          backgroundColor: "#000",
        }}
        tabIndex={zoom > 1 ? 0 : -1}
        role="region"
        aria-label={zoom > 1 ? `Magnified photo view (${zoom}x). Use arrow keys to scroll.` : "Photo preview"}
      >
        <img
          src={previewUrl}
          alt={`Photograph: ${filename}`}
          className="preview-image"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: "center center",
            transition: "transform 0.2s ease, filter 0.2s ease",
            filter: getFilterStyle(),
            maxWidth: "100%",
            height: "auto",
          }}
        />
      </div>

      {/* Metadata & Remove Button */}
      <div style={{ textAlign: "center", marginTop: "0.5rem" }}>
        <p style={{ fontWeight: 700, fontSize: "1.05rem" }}>{filename}</p>
        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
          {(sizeBytes / (1024 * 1024)).toFixed(2)} MB • {fileType || "Image"}
          {zoom > 1 && ` • ${zoom}x zoom`}
          {filter !== "none" && ` • ${filter}`}
        </p>
      </div>

      <div className="preview-actions">
        <button
          type="button"
          className="btn-danger"
          onClick={onRemovePhoto}
          disabled={isAnalyzing}
          aria-label="Remove photo"
        >
          <Trash2 size={16} aria-hidden="true" />
          <span>Remove photo</span>
        </button>
      </div>
    </div>
  );
};
