// Loading skeleton component for improved perceived performance
export function LoadingSkeleton({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse bg-gradient-to-r from-[var(--carbon-light)] via-[var(--steel)] to-[var(--carbon-light)] bg-[length:200%_100%] ${className}`}
      style={{
        animation: "skeleton-shimmer 2s ease-in-out infinite",
      }}
      {...props}
    />
  );
}

export function PanelLoadingSkeleton() {
  return (
    <div className="pm-panel" style={{ padding: "16px" }}>
      <LoadingSkeleton style={{ height: 20, width: "60%", marginBottom: 16 }} />
      <LoadingSkeleton style={{ height: 12, width: "100%", marginBottom: 8 }} />
      <LoadingSkeleton style={{ height: 12, width: "90%", marginBottom: 8 }} />
      <LoadingSkeleton style={{ height: 12, width: "85%", marginBottom: 16 }} />
      <LoadingSkeleton style={{ height: 40, width: "100%" }} />
    </div>
  );
}

export function ChartLoadingSkeleton() {
  return (
    <div style={{ padding: "16px" }}>
      <LoadingSkeleton style={{ height: 200, width: "100%", marginBottom: 8 }} />
      <div style={{ display: "flex", gap: 8, justifyContent: "space-around" }}>
        <LoadingSkeleton style={{ height: 12, width: 60 }} />
        <LoadingSkeleton style={{ height: 12, width: 60 }} />
        <LoadingSkeleton style={{ height: 12, width: 60 }} />
      </div>
    </div>
  );
}

// Add shimmer animation to global styles
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = `
    @keyframes skeleton-shimmer {
      0% {
        background-position: 200% 0;
      }
      100% {
        background-position: -200% 0;
      }
    }
  `;
  document.head.appendChild(style);
}
