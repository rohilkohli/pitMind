import React from "react";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
}) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        textAlign: "center",
        color: "var(--text-secondary)",
      }}
    >
      {Icon && (
        <Icon
          size={48}
          style={{
            marginBottom: "16px",
            opacity: 0.3,
          }}
        />
      )}
      <h3
        style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: "14px",
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--text-primary)",
          marginBottom: "8px",
        }}
      >
        {title}
      </h3>
      {description && (
        <p
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "11px",
            color: "var(--text-secondary)",
            maxWidth: "300px",
            lineHeight: 1.5,
            marginBottom: action ? "16px" : "0",
          }}
        >
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          style={{
            padding: "8px 16px",
            background: "var(--carbon-mid)",
            border: "1px solid var(--border)",
            color: "var(--text-primary)",
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: "11px",
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--f1-red)";
            e.currentTarget.style.color = "var(--f1-red)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.color = "var(--text-primary)";
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
};
