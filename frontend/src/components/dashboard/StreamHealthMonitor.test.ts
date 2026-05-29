import { describe, expect, it } from "vitest";
import { getStatusColor } from "./StreamHealthMonitor";
import type { ConnectionStatus } from "./StreamHealthMonitor";

describe("getStatusColor", () => {
  it("should return correct classes for connected status", () => {
    expect(getStatusColor("connected")).toBe(
      "bg-[var(--neon-green-dim)] border-[var(--neon-green)] text-[var(--neon-green)]",
    );
  });

  it("should return correct classes for connecting status", () => {
    expect(getStatusColor("connecting")).toBe(
      "bg-[var(--amber-dim)] border-[var(--amber)] text-[var(--amber)] animate-pulse",
    );
  });

  it("should return correct classes for reconnecting status", () => {
    expect(getStatusColor("reconnecting")).toBe(
      "bg-[var(--amber-dim)] border-[var(--amber)] text-[var(--amber)] animate-pulse",
    );
  });

  it("should return correct classes for disconnected status", () => {
    expect(getStatusColor("disconnected")).toBe(
      "bg-[var(--f1-red-dim)] border-[var(--f1-red)] text-[var(--f1-red)]",
    );
  });

  it("should return correct classes for error status", () => {
    expect(getStatusColor("error")).toBe(
      "bg-[var(--f1-red-dim)] border-[var(--f1-red)] text-[var(--f1-red)]",
    );
  });

  it("should return correct classes for offline status", () => {
    expect(getStatusColor("offline")).toBe(
      "bg-[var(--carbon-mid)] border-[var(--border)] text-[var(--text-secondary)]",
    );
  });

  it("should return default classes for unknown status", () => {
    expect(getStatusColor("unknown" as ConnectionStatus)).toBe(
      "bg-[var(--carbon-mid)] border-[var(--border)] text-[var(--text-secondary)]",
    );
  });
});
