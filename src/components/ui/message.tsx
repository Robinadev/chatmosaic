import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type MessageAlign = "start" | "end";

type MessageProps = HTMLAttributes<HTMLDivElement> & {
  align?: MessageAlign;
};

export function Message({ align = "start", className, ...props }: MessageProps) {
  return (
    <div
      data-slot="message"
      data-align={align}
      className={cn(
        "flex w-full items-end gap-2",
        align === "end" && "justify-end",
        className,
      )}
      {...props}
    />
  );
}

export function MessageAvatar({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      data-slot="message-avatar"
      className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground", className)}
      {...props}
    />
  );
}

export function MessageContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="message-content" className={cn("flex min-w-0 max-w-[88%] flex-col gap-1.5", className)} {...props} />;
}

export function MessageHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="message-header" className={cn("text-xs font-medium text-muted-foreground", className)} {...props} />;
}

export function MessageFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="message-footer" className={cn("flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground", className)} {...props} />;
}

export function MessageGroup({ className, children, ...props }: HTMLAttributes<HTMLDivElement> & { children?: ReactNode }) {
  return <div data-slot="message-group" className={cn("flex flex-col gap-3", className)} {...props}>{children}</div>;
}
