import React, { useEffect } from "react";
import { MinimizeIcon } from "./MinimizeIcon";
import { usePanelState } from "../../hooks/usePanelState";

interface MinimizablePanelProps {
  id: string; // unique ID for state persistence
  header: React.ReactNode; // the panel title / header bar content (WITHOUT the minimize button)
  children: React.ReactNode; // the panel body content
  defaultCollapsed?: boolean;
  persist?: boolean;
  headerClassName?: string;
  bodyClassName?: string;
  className?: string;
  onCollapseChange?: (isCollapsed: boolean) => void;
  animationDuration?: number; // ms, default 300
  showToggle?: boolean; // when false, hides the collapse chevron (default true)
  // Style overrides
  headerStyle?: React.CSSProperties;
  bodyStyle?: React.CSSProperties;
  style?: React.CSSProperties;
}

export const MinimizablePanel: React.FC<MinimizablePanelProps> = ({
  id,
  header,
  children,
  defaultCollapsed = false,
  persist = true,
  headerClassName = "",
  bodyClassName = "",
  className = "",
  onCollapseChange,
  animationDuration = 300,
  showToggle = true,
  headerStyle,
  bodyStyle,
  style,
}) => {
  const { isCollapsed, toggle } = usePanelState({ id, defaultCollapsed, persist });

  useEffect(() => {
    onCollapseChange?.(isCollapsed);
  }, [isCollapsed, onCollapseChange]);

  const dur = animationDuration;
  const opacityDur = Math.round(dur * 0.8);

  return (
    <div
      className={`pitmind-minimizable-panel ${isCollapsed ? "is-collapsed" : ""} ${className}`}
      style={{
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        ...style,
      }}
    >
      {/* Header — always visible */}
      <div
        id={`${id}-header`}
        className={`pitmind-panel-header ${headerClassName}`}
        onClick={isCollapsed ? toggle : undefined}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
          cursor: isCollapsed ? "pointer" : "default",
          userSelect: "none",
          gap: "8px",
          ...headerStyle,
        }}
      >
        {/* Left side: whatever the panel passes as its header */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: 0 }}>
          {header}
        </div>

        {/* Right side: minimize button (hidden when showToggle=false) */}
        {showToggle && <MinimizeIcon isCollapsed={isCollapsed} onToggle={toggle} size={14} />}
      </div>

      {/* Body — collapses smoothly */}
      <div
        role="region"
        aria-labelledby={`${id}-header`}
        style={{
          maxHeight: isCollapsed ? "0px" : "100000px",
          overflow: "hidden",
          transition: `max-height ${dur}ms cubic-bezier(0.4, 0, 0.2, 1), opacity ${opacityDur}ms ease`,
          opacity: isCollapsed ? 0 : 1,
          flex: isCollapsed ? "0 0 0px" : "1 1 auto",
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          className={`pitmind-panel-body ${bodyClassName}`}
          style={{
            display: "flex",
            flexDirection: "column",
            flex: "1 1 auto",
            minHeight: 0,
            overflow: "hidden",
            ...bodyStyle,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};
