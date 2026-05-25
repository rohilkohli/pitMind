import React, { useState } from "react";
import { Share2, Copy, Check } from "lucide-react";

interface ShareButtonProps {
  onCopyUrl: () => Promise<boolean>;
  getShareUrl: () => string;
}

export const ShareButton: React.FC<ShareButtonProps> = ({ onCopyUrl, getShareUrl }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await onCopyUrl();
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative">
      {/* Share button (just an SVG icon) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
          border: "1px solid var(--border)",
          color: "var(--text-secondary)",
          width: "34px",
          height: "34px",
          cursor: "pointer",
          borderRadius: 0,
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "var(--text-primary)";
          e.currentTarget.style.borderColor = "var(--f1-red)";
          e.currentTarget.style.background = "var(--f1-red-dim)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "var(--text-secondary)";
          e.currentTarget.style.borderColor = "var(--border)";
          e.currentTarget.style.background = "transparent";
        }}
        title="Share view"
      >
        <Share2 className="w-4 h-4" />
      </button>

      {/* Share panel */}
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 z-50 w-80"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              padding: "16px",
              border: "1px solid var(--border)",
              background: "var(--carbon-light)",
              borderRadius: 0,
              boxShadow: "0 10px 25px -5px rgba(0,0,0,0.5)",
            }}
          >
            <h3
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "var(--text-primary)",
                marginBottom: "12px",
              }}
            >
              Share this view
            </h3>

            {/* URL display */}
            <div className="mb-4">
              <div
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: "10px",
                  fontWeight: 600,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: "var(--text-secondary)",
                  marginBottom: "6px",
                }}
              >
                Shareable URL
              </div>
              <div
                style={{
                  padding: "10px",
                  background: "var(--carbon)",
                  border: "1px solid var(--border)",
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: "10px",
                  color: "var(--chrome)",
                  wordBreak: "break-all",
                  borderRadius: 0,
                }}
              >
                {getShareUrl()}
              </div>
            </div>

            {/* Copy button */}
            <button
              onClick={handleCopy}
              style={{
                width: "100%",
                padding: "10px 16px",
                borderRadius: 0,
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700,
                fontSize: "10px",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                cursor: "pointer",
                transition: "all 0.2s",
                border: copied ? "1px solid rgba(57, 255, 20, 0.3)" : "none",
                background: copied ? "var(--neon-green-dim)" : "var(--f1-red)",
                color: copied ? "var(--neon-green)" : "#fff",
                clipPath: "polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)",
              }}
              onMouseEnter={(e) => {
                if (!copied) {
                  e.currentTarget.style.background = "#c00024";
                }
              }}
              onMouseLeave={(e) => {
                if (!copied) {
                  e.currentTarget.style.background = "var(--f1-red)";
                }
              }}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy URL
                </>
              )}
            </button>

            {/* Info */}
            <p
              style={{
                marginTop: "12px",
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "10px",
                color: "var(--text-secondary)",
                lineHeight: "1.4",
              }}
            >
              Share this URL with your team to show them your current strategy view, telemetry, and
              live metrics.
            </p>

            {/* Quick close option */}
            <button
              onClick={() => setIsOpen(false)}
              style={{
                width: "100%",
                marginTop: "12px",
                padding: "8px 16px",
                borderRadius: 0,
                border: "1px solid var(--border)",
                background: "transparent",
                color: "var(--text-secondary)",
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 600,
                fontSize: "10px",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                cursor: "pointer",
                transition: "all 0.2s",
                clipPath: "polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--text-primary)";
                e.currentTarget.style.borderColor = "var(--chrome-dim)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--text-secondary)";
                e.currentTarget.style.borderColor = "var(--border)";
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />}
    </div>
  );
};
