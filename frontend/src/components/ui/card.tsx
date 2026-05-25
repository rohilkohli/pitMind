import * as React from "react";

import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("f1-card", className)} {...props} />;
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("border-b border-f1-border px-6 py-4", className)} {...props} />;
}

export function CardTitle({
  className,
  id,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement> & { id?: string }) {
  return (
    <h2
      id={id}
      className={cn(
        "text-sm font-bold tracking-widest text-f1-white uppercase font-display",
        className,
      )}
      {...props}
    >
      {children}
    </h2>
  );
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-6 py-5", className)} {...props} />;
}
