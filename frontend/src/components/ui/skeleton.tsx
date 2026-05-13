import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse bg-f1-elevated", className)}
      aria-hidden="true"
      role="presentation"
    />
  );
}
