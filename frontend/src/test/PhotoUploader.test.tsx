import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PhotoUploader } from "../components/PhotoUploader";

describe("PhotoUploader component", () => {
  it("renders upload dropzone when no file is selected", () => {
    render(
      <PhotoUploader
        selectedFile={null}
        previewUrl={null}
        mode="concise"
        isAnalyzing={false}
        onFileSelect={vi.fn()}
        onRemovePhoto={vi.fn()}
        onChangeMode={vi.fn()}
        onAnalyze={vi.fn()}
      />
    );

    expect(screen.getByText(/Drop a photo here or browse/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Browse files on your computer/i })).toBeInTheDocument();
  });

  it("allows switching between concise and detailed description modes", () => {
    const changeMode = vi.fn();
    render(
      <PhotoUploader
        selectedFile={null}
        previewUrl={null}
        mode="concise"
        isAnalyzing={false}
        onFileSelect={vi.fn()}
        onRemovePhoto={vi.fn()}
        onChangeMode={changeMode}
        onAnalyze={vi.fn()}
      />
    );

    const detailedOption = screen.getByRole("radio", { name: /Detailed description/i });
    fireEvent.click(detailedOption);
    expect(changeMode).toHaveBeenCalledWith("detailed");
  });

  it("renders preview and remove button when file is selected", () => {
    const dummyFile = new File(["dummy"], "family_photo.jpg", { type: "image/jpeg" });
    const removePhoto = vi.fn();

    render(
      <PhotoUploader
        selectedFile={dummyFile}
        previewUrl="blob:http://localhost/123"
        mode="concise"
        isAnalyzing={false}
        onFileSelect={vi.fn()}
        onRemovePhoto={removePhoto}
        onChangeMode={vi.fn()}
        onAnalyze={vi.fn()}
      />
    );

    expect(screen.getByText("family_photo.jpg")).toBeInTheDocument();
    const removeBtn = screen.getByRole("button", { name: /Remove photo/i });
    expect(removeBtn).toBeInTheDocument();
    fireEvent.click(removeBtn);
    expect(removePhoto).toHaveBeenCalledTimes(1);
  });
});
