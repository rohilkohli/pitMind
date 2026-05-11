import * as React from "react";

import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="region"
      className={cn("rounded-2xl border border-pit-stroke bg-pit-panel/90 backdrop-blur transition-all duration-300 hover:border-f1-red/30 hover:shadow-glow-lg", className)}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("border-b border-pit-stroke px-6 py-4", className)} {...props} />;
}

export function CardTitle({
  className,
  id,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement> & { id?: string }) {
  return (
    <h2 id={id} className={cn("text-xl font-extrabold tracking-tight text-pit-fg uppercase", className)} {...props}>
      {children}
    </h2>
  );
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-6 py-5", className)} {...props} />;
}
