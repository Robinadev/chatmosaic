import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const bubbleVariants = cva(
  "w-fit max-w-full rounded-xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        secondary: "border border-border bg-card text-card-foreground",
        muted: "bg-muted text-foreground",
        tinted: "bg-accent text-accent-foreground",
        outline: "border border-border bg-background text-foreground",
        ghost: "w-full bg-transparent px-0 py-0 text-foreground shadow-none",
        destructive: "bg-destructive text-destructive-foreground",
      },
      align: {
        start: "rounded-bl-sm",
        end: "rounded-br-sm",
      },
    },
    defaultVariants: {
      variant: "secondary",
      align: "start",
    },
  },
);

export type BubbleProps = HTMLAttributes<HTMLDivElement> & VariantProps<typeof bubbleVariants>;

export function Bubble({ className, variant, align, ...props }: BubbleProps) {
  return (
    <div
      data-slot="bubble"
      data-variant={variant ?? "secondary"}
      className={cn(bubbleVariants({ variant, align }), className)}
      {...props}
    />
  );
}

export function BubbleContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="bubble-content" className={cn("min-w-0", className)} {...props} />;
}
