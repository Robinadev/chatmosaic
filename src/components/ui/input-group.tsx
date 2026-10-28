import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";

export function InputGroup({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="input-group"
      className={cn("flex min-w-0 items-end gap-2 rounded-lg border border-input bg-background p-2 transition-colors focus-within:ring-1 focus-within:ring-ring", className)}
      {...props}
    />
  );
}

export function InputGroupTextarea({ className, ...props }: React.ComponentProps<typeof Textarea>) {
  return (
    <Textarea
      data-slot="input-group-control"
      className={cn("min-h-10 flex-1 resize-none border-0 bg-transparent px-2 py-1 shadow-none focus-visible:ring-0", className)}
      {...props}
    />
  );
}

export function InputGroupAddon({
  align = "inline-end",
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  align?: "inline-start" | "inline-end" | "block-start" | "block-end";
}) {
  return (
    <div
      data-slot="input-group-addon"
      data-align={align}
      className={cn(
        "flex shrink-0 items-center",
        align === "block-start" && "self-start",
        align === "block-end" && "self-end",
        className,
      )}
      {...props}
    />
  );
}
