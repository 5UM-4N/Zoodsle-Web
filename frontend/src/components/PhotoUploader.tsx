import React, { useRef, useState } from "react";
import { UploadCloud, Image as ImageIcon, Sparkles, CheckCircle2 } from "lucide-react";
import { DescriptionMode } from "../types";
import { PhotoPreviewLoupe } from "./PhotoPreviewLoupe";

interface PhotoUploaderProps {
  selectedFile: File | null;
  previewUrl: string | null;
  mode: DescriptionMode;
  isAnalyzing: boolean;
  onFileSelect: (file: File) => void;
  onRemovePhoto: () => void;
  onChangeMode: (mode: DescriptionMode) => void;
  onAnalyze: () => void;
}

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({
  selectedFile,
  previewUrl,
  mode,
  isAnalyzing,
  onFileSelect,
  onRemovePhoto,
  onChangeMode,
  onAnalyze,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const files = e.target.files;
    if (files && files.length > 0) {
      validateAndSetFile(files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setFileError("Please upload a JPEG, PNG, or WebP photo.");
      return;
    }
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setFileError(`File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the 10 MB limit.`);
      return;
    }
    setFileError(null);
    onFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleKeyDownDropzone = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  };

  return (
    <section className="card" id="uploader-section" aria-labelledby="uploader-section-heading">
      <h2 id="uploader-section-heading" className="card-title">
        <ImageIcon size={22} aria-hidden="true" color="var(--accent-hover)" />
        Select photo
      </h2>

      <input
        ref={fileInputRef}
        type="file"
        id="photo-file-input"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="sr-only"
        aria-describedby="uploader-instructions"
      />

      {fileError && (
        <div className="alert-banner error" role="alert" style={{ marginBottom: "1rem" }}>
          <p>{fileError}</p>
        </div>
      )}

      {!selectedFile || !previewUrl ? (
        <div
          className={`dropzone ${isDragOver ? "active" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={handleKeyDownDropzone}
          tabIndex={0}
          role="button"
          aria-label="Upload a photo. Click or press Enter to browse files, or drag and drop a JPEG, PNG, or WebP photo here."
        >
          <UploadCloud className="dropzone-icon" aria-hidden="true" />
          <div>
            <p className="dropzone-heading">Drop a photo here or browse</p>
            <p id="uploader-instructions" className="dropzone-instructions">
              JPEG, PNG, or WebP up to 10 MB. Press U to focus here anytime.
            </p>
          </div>
          <button
            type="button"
            className="btn-primary"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            aria-label="Browse files on your computer"
          >
            Browse files
          </button>
        </div>
      ) : (
        <PhotoPreviewLoupe
          previewUrl={previewUrl}
          filename={selectedFile.name}
          sizeBytes={selectedFile.size}
          fileType={selectedFile.type}
          isAnalyzing={isAnalyzing}
          onRemovePhoto={onRemovePhoto}
        />
      )}

      <div className="mode-selector">
        <label id="mode-group-label" style={{ fontWeight: 700, fontSize: "1rem" }}>
          Detail level
        </label>
        <div
          className="radio-group"
          role="radiogroup"
          aria-labelledby="mode-group-label"
        >
          <div
            className={`radio-card ${mode === "concise" ? "selected" : ""}`}
            onClick={() => onChangeMode("concise")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onChangeMode("concise");
              }
            }}
            tabIndex={0}
            role="radio"
            aria-checked={mode === "concise"}
            aria-label="Short description: 2 to 4 sentences covering subjects, layout, colors, and visible text."
          >
            <div className="radio-card-header">
              {mode === "concise" && <CheckCircle2 size={18} color="var(--accent-hover)" aria-hidden="true" />}
              <span>Short description</span>
            </div>
            <p className="radio-card-desc">
              2 to 4 sentences covering the main subjects, setting, colors, and visible text.
            </p>
          </div>

          <div
            className={`radio-card ${mode === "detailed" ? "selected" : ""}`}
            onClick={() => onChangeMode("detailed")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onChangeMode("detailed");
              }
            }}
            tabIndex={0}
            role="radio"
            aria-checked={mode === "detailed"}
            aria-label="Detailed description: In-depth breakdown of subjects, layout, lighting, colors, text, and uncertainties."
          >
            <div className="radio-card-header">
              {mode === "detailed" && <CheckCircle2 size={18} color="var(--accent-hover)" aria-hidden="true" />}
              <span>Detailed description</span>
            </div>
            <p className="radio-card-desc">
              Structured breakdown: scene overview, subjects, spatial layout, lighting, legible text, and visual uncertainties.
            </p>
          </div>
        </div>
      </div>

      {selectedFile && (
        <div style={{ marginTop: "1.25rem" }}>
          <button
            type="button"
            className="btn-primary"
            onClick={onAnalyze}
            disabled={isAnalyzing}
            aria-busy={isAnalyzing}
            style={{ width: "100%", minHeight: "48px", fontSize: "1.05rem" }}
          >
            {isAnalyzing ? (
              <>
                <span className="spinner" aria-hidden="true" />
                <span>Describing photo...</span>
              </>
            ) : (
              <>
                <Sparkles size={18} aria-hidden="true" />
                <span>Describe photo</span>
              </>
            )}
          </button>
        </div>
      )}
    </section>
  );
};
