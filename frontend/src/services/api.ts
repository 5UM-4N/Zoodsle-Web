import { DescribeResponse, HealthStatus, ChatResponse, ChatMessage, DescriptionMode } from "../types";

const rawBase = import.meta.env.VITE_API_BASE_URL || "/api";
const API_BASE = rawBase.replace(/\/+$/, "");

export async function fetchHealth(): Promise<HealthStatus> {
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      throw new Error(errorJson.detail || `Server responded with status ${res.status}`);
    }
    return await res.json();
  } catch (err: any) {
    return {
      status: "error",
      connected: false,
      is_local: true,
      base_url: "http://127.0.0.1:1234/v1",
      configured_model: "qwen/qwen3-vl-4b",
      model_available: false,
      available_models: [],
      max_upload_mb: 10,
      error: err.message || "Failed to connect to backend server. Make sure the FastAPI service is running.",
    };
  }
}

export async function describePhoto(file: File, mode: DescriptionMode): Promise<DescribeResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("mode", mode);

  const res = await fetch(`${API_BASE}/describe`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    const message = errorJson.detail || `Analysis failed (${res.status}: ${res.statusText})`;
    throw new Error(message);
  }

  return await res.json();
}

export async function sendChatMessage(
  imageDataUrl: string,
  question: string,
  history: ChatMessage[]
): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      image_data_url: imageDataUrl,
      question,
      history,
    }),
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    const message = errorJson.detail || `Follow-up request failed (${res.status})`;
    throw new Error(message);
  }

  return await res.json();
}
