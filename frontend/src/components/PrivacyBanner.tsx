import React from "react";
import { ShieldCheck, AlertTriangle, AlertCircle } from "lucide-react";
import { HealthStatus } from "../types";

interface PrivacyBannerProps {
  health: HealthStatus | null;
}

export const PrivacyBanner: React.FC<PrivacyBannerProps> = ({ health }) => {
  const isConnected = health?.connected;
  const isModelAvailable = health?.model_available;

  return (
    <section aria-labelledby="privacy-safety-heading" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <h2 id="privacy-safety-heading" className="sr-only">
        Privacy and safety
      </h2>

      {!isConnected && (
        <div className="alert-banner error" role="alert">
          <AlertCircle size={24} aria-hidden="true" style={{ flexShrink: 0, marginTop: "2px" }} />
          <div className="alert-content">
            <h4>LM Studio offline</h4>
            <p>
              Cannot reach LM Studio at <code>{health?.base_url || "http://127.0.0.1:1234/v1"}</code>. Start LM Studio and turn on the local developer server.
            </p>
          </div>
        </div>
      )}

      {isConnected && !isModelAvailable && (
        <div className="alert-banner disclaimer" role="alert">
          <AlertTriangle size={24} aria-hidden="true" style={{ flexShrink: 0, marginTop: "2px" }} />
          <div className="alert-content">
            <h4>Model not loaded</h4>
            <p>
              <code>{health?.configured_model}</code> is not loaded in LM Studio.
              {health?.available_models && health.available_models.length > 0
                ? ` Loaded models: ${health.available_models.join(", ")}.`
                : " No models are currently loaded."}
            </p>
          </div>
        </div>
      )}

      <div className="banner-grid">
        <div className="alert-banner privacy">
          <ShieldCheck size={24} aria-hidden="true" style={{ flexShrink: 0, marginTop: "2px" }} />
          <div className="alert-content">
            <h4>Local processing</h4>
            <p>
              Inference runs on your machine through LM Studio. Photos stay in memory and are never saved or sent to cloud servers.
            </p>
          </div>
        </div>

        <div className="alert-banner disclaimer">
          <AlertTriangle size={24} aria-hidden="true" style={{ flexShrink: 0, marginTop: "2px" }} />
          <div className="alert-content">
            <h4>Model limitations</h4>
            <p>
              Descriptions can miss details or misread objects. Facial recognition is disabled; the model will not identify people by name.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
