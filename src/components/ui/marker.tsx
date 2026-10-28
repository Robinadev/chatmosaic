import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Marker({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="marker"
      className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export function MarkerIcon({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      data-slot="marker-icon"
      aria-hidden="true"
      className={cn("inline-flex shrink-0 items-center justify-center", className)}
      {...props}
    />
  );
}

export function MarkerContent({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return <span data-slot="marker-content" className={cn("min-w-0", className)} {...props} />;
}
