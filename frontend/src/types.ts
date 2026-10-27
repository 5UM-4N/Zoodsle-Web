export type DescriptionMode = "concise" | "detailed";
export type TextScale = "normal" | "large" | "xlarge";
export type ThemeMode = "light" | "dark" | "high-contrast";
export type ContrastTheme = "standard" | "high-contrast" | ThemeMode;

export interface HealthStatus {
  status: string;
  connected: boolean;
  is_local: boolean;
  base_url: string;
  configured_model: string;
  model_available: boolean;
  available_models: string[];
  max_upload_mb: number;
  error?: string | null;
}

export interface ImageMetadata {
  format: string;
  mime_type: string;
  width: number;
  height: number;
  size_bytes: number;
  filename: string;
  orientation?: "landscape" | "portrait" | "square";
}

export interface DescribeResponse {
  description: string;
  mode: DescriptionMode;
  metadata: ImageMetadata;
  model: string;
  is_local: boolean;
  privacy_notice: string;
  image_data_url: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  response: string;
  model: string;
  is_local: boolean;
}
