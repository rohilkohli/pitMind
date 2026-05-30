import React, { Component, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to error reporting service
    if (import.meta.env.DEV) {
      console.error("ErrorBoundary caught error:", error, errorInfo);
    }
    // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div
          style={{
            padding: "24px",
            background: "var(--carbon-light)",
            border: "1px solid var(--border)",
            borderLeft: "3px solid var(--f1-red)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "12px",
            margin: "20px",
          }}
        >
          <AlertTriangle size={32} style={{ color: "var(--f1-red)" }} />
          <h3
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: "16px",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--text-primary)",
            }}
          >
            Something Went Wrong
          </h3>
          <p
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "12px",
              color: "var(--text-secondary)",
              textAlign: "center",
              maxWidth: "400px",
            }}
          >
            {this.state.error?.message || "An unexpected error occurred"}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "8px 16px",
              background: "var(--f1-red)",
              color: "white",
              border: "none",
              borderRadius: "2px",
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: "12px",
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            Reload Page
          </button>
          {import.meta.env.DEV && this.state.error && (
            <details
              style={{
                marginTop: "12px",
                padding: "12px",
                background: "var(--carbon)",
                border: "1px solid var(--border)",
                width: "100%",
                maxWidth: "600px",
              }}
            >
              <summary
                style={{
                  cursor: "pointer",
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: "11px",
                  color: "var(--text-secondary)",
                }}
              >
                Error Details (Dev Only)
              </summary>
              <pre
                style={{
                  marginTop: "8px",
                  fontSize: "10px",
                  color: "var(--f1-red)",
                  overflow: "auto",
                  fontFamily: "'IBM Plex Mono', monospace",
                }}
              >
                {this.state.error.stack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
