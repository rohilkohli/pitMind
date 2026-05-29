import React from "react";

interface MinimizeIconProps {
  isCollapsed: boolean;
  onToggle: () => void;
  size?: number;
  className?: string;
  "aria-label"?: string;
}

export const MinimizeIcon: React.FC<MinimizeIconProps> = ({
  isCollapsed,
  onToggle,
  size = 16,
  className = "",
  "aria-label": ariaLabel,
}) => {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      aria-label={ariaLabel ?? (isCollapsed ? "Expand panel" : "Minimize panel")}
      aria-expanded={!isCollapsed}
      title={isCollapsed ? "Expand" : "Minimize"}
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: "4px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "4px",
        transition: "background 0.15s ease, transform 0.1s ease, outline-color 0.15s ease",
        flexShrink: 0,
        color: "var(--text-secondary)",
        outline: "2px solid transparent",
        outlineOffset: "2px",
      }}
      className={`pitmind-minimize-btn ${className}`}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(255,24,1,0.12)";
        e.currentTarget.style.color = "var(--f1-red)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "none";
        e.currentTarget.style.color = "var(--text-secondary)";
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = "scale(0.85)";
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = "scale(1)";
      }}
      onFocus={(e) => {
        e.currentTarget.style.outlineColor = "var(--f1-red)";
      }}
      onBlur={(e) => {
        e.currentTarget.style.outlineColor = "transparent";
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          transform: isCollapsed ? "rotate(180deg)" : "rotate(0deg)",
          transition: "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
          display: "block",
        }}
      >
        {/* Chevron pointing UP (minimize = collapse down) */}
        <path
          d="M3 10L8 5L13 10"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
};
