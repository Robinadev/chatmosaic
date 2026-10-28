"use client";

import { useState } from "react";
import { FileText, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { ChatComposer } from "@/components/chat/chat-composer";
import { ChatThread } from "@/components/chat/chat-thread";
import { ChatMessageSummary, DashboardPayload } from "@/lib/types";

type ChatPanelProps = {
  dashboard: DashboardPayload;
  onRefresh: () => Promise<unknown>;
  expanded?: boolean;
};

type ChatResponse = {
  messages: ChatMessageSummary[];
  error?: string;
};

export function ChatPanel({ dashboard, onRefresh, expanded = false }: ChatPanelProps) {
  const [pendingQuestion, setPendingQuestion] = useState("");
  const [isPending, setIsPending] = useState(false);

  async function sendMessage(message: string): Promise<boolean> {
    if (isPending) return false;

    setPendingQuestion(message);
    setIsPending(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const result = (await response.json()) as ChatResponse;

      if (!response.ok) {
        toast.error(result.error ?? "The assistant could not answer that. Please try again.");
        return false;
      }

      await onRefresh();
      return true;
    } catch {
      toast.error("The assistant could not connect. Please try again.");
      return false;
    } finally {
      setPendingQuestion("");
      setIsPending(false);
    }
  }

  return (
    <section className={`chat-panel panel ${expanded ? "chat-panel-expanded" : ""}`}>
      <div className="chat-heading">
        <div>
          <span className="chat-heading-icon"><Sparkles aria-hidden="true" /></span>
          <div>
            <h2>{expanded ? "Chat preview" : "Try your assistant"}</h2>
            <p>{expanded ? "Answers use your private, uploaded sources." : "See how your sources answer questions."}</p>
          </div>
        </div>
        <span className="chat-preview-status"><span className="live-dot" /> Private preview</span>
      </div>
      <ChatThread
        messages={dashboard.messages}
        assistantName={dashboard.workspace.assistantName}
        welcomeMessage={dashboard.workspace.welcomeMessage}
        pendingQuestion={pendingQuestion}
        isPending={isPending}
        onSuggestion={(question) => void sendMessage(question)}
      />
      <ChatComposer disabled={isPending} onSend={sendMessage} />
      <div className="chat-disclaimer">
        <FileText aria-hidden="true" /> Answers are grounded in the sources you upload. Preview chats are saved to your workspace.
      </div>
    </section>
  );
}
