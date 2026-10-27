import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Header } from "../components/Header";
import { HealthStatus } from "../types";

describe("Header component", () => {
  const mockHealthReady: HealthStatus = {
    status: "ok",
    connected: true,
    is_local: true,
    base_url: "http://127.0.0.1:1234/v1",
    configured_model: "qwen/qwen3-vl-4b",
    model_available: true,
    available_models: ["qwen/qwen3-vl-4b"],
    max_upload_mb: 10,
  };

  it("renders the brand title and connected status", () => {
    render(
      <Header
        health={mockHealthReady}
        checkingHealth={false}
        onRefreshHealth={vi.fn()}
        fontScale="normal"
        onChangeFontScale={vi.fn()}
        contrast="standard"
        onToggleContrast={vi.fn()}
      />
    );

    expect(screen.getByRole("heading", { name: /ZoodSle/i })).toBeInTheDocument();
    expect(screen.getByText(/Ready \(qwen\/qwen3-vl-4b\)/i)).toBeInTheDocument();
  });

  it("toggles high contrast mode when contrast button is clicked", () => {
    const toggleContrast = vi.fn();
    render(
      <Header
        health={mockHealthReady}
        checkingHealth={false}
        onRefreshHealth={vi.fn()}
        fontScale="normal"
        onChangeFontScale={vi.fn()}
        contrast="standard"
        onToggleContrast={toggleContrast}
      />
    );

    const btn = screen.getByRole("button", { name: /Toggle high contrast/i });
    fireEvent.click(btn);
    expect(toggleContrast).toHaveBeenCalledTimes(1);
  });

  it("displays disconnected state when server is unreachable", () => {
    const mockHealthDisconnected: HealthStatus = {
      status: "error",
      connected: false,
      is_local: true,
      base_url: "http://127.0.0.1:1234/v1",
      configured_model: "qwen/qwen3-vl-4b",
      model_available: false,
      available_models: [],
      max_upload_mb: 10,
    };

    render(
      <Header
        health={mockHealthDisconnected}
        checkingHealth={false}
        onRefreshHealth={vi.fn()}
        fontScale="normal"
        onChangeFontScale={vi.fn()}
        contrast="standard"
        onToggleContrast={vi.fn()}
      />
    );

    expect(screen.getByText(/LM Studio offline/i)).toBeInTheDocument();
  });
});
