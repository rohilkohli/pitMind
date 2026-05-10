import * as React from "react";

import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="region"
      className={cn("rounded-xl border border-pit-stroke bg-pit-panel/90 backdrop-blur", className)}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("border-b border-pit-stroke px-4 py-3", className)} {...props} />;
}

export function CardTitle({
  className,
  id,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement> & { id?: string }) {
  return (
    <h2 id={id} className={cn("text-lg font-semibold tracking-tight text-pit-fg", className)} {...props}>
      {children}
    </h2>
  );
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-4 py-4", className)} {...props} />;
}
