"use client";

import { useState, type CSSProperties } from "react";
import { HeartHandshake, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { ChatComposer } from "@/components/chat/chat-composer";
import { ChatThread } from "@/components/chat/chat-thread";
import type { ChatMessageSummary, SourceDocumentReference } from "@/lib/types";

type PublicAssistantProps = {
  assistant: {
    slug: string;
    organizationName: string;
    assistantName: string;
    welcomeMessage: string;
    accentColor: string;
  };
};

type PublicChatResponse = {
  answer?: string;
  sources?: SourceDocumentReference[];
  error?: string;
};

export function PublicAssistant({ assistant }: PublicAssistantProps) {
  const [messages, setMessages] = useState<ChatMessageSummary[]>([]);
  const [pendingQuestion, setPendingQuestion] = useState("");
  const [isPending, setIsPending] = useState(false);

  async function sendMessage(message: string): Promise<boolean> {
    if (isPending) return false;
    setPendingQuestion(message);
    setIsPending(true);

    try {
      const response = await fetch(`/api/assistant/${encodeURIComponent(assistant.slug)}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const result = (await response.json()) as PublicChatResponse;
      if (!response.ok || !result.answer) {
        toast.error(result.error ?? "The assistant could not answer that. Please try again.");
        return false;
      }

      const createdAt = new Date().toISOString();
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "user",
          content: message,
          sourceDocuments: [],
          createdAt,
        },
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: result.answer!,
          sourceDocuments: result.sources ?? [],
          createdAt,
        },
      ]);
      return true;
    } catch {
      toast.error("The assistant could not connect. Please try again.");
      return false;
    } finally {
      setPendingQuestion("");
      setIsPending(false);
    }
  }

  const accentStyle = {
    "--primary": assistant.accentColor,
    "--green": assistant.accentColor,
    "--assistant-accent": assistant.accentColor,
  } as CSSProperties;

  return (
    <main className="public-assistant-page" style={accentStyle}>
      <header className="public-assistant-header">
        <a className="brand" href="/" aria-label="ChatMosaic home">
          <span className="brand-mark"><HeartHandshake aria-hidden="true" /></span>
          <span>ChatMosaic<span className="brand-period">.</span></span>
        </a>
        <span className="powered-by">Community assistant</span>
      </header>
      <section className="public-assistant-card">
        <div className="public-assistant-intro">
          <span className="public-assistant-icon"><HeartHandshake aria-hidden="true" /></span>
          <div>
            <span className="eyebrow">{assistant.organizationName}</span>
            <h1>{assistant.assistantName}</h1>
            <p>{assistant.welcomeMessage}</p>
          </div>
        </div>
        <div className="public-chat-panel">
          <ChatThread
            messages={messages}
            assistantName={assistant.assistantName}
            welcomeMessage={assistant.welcomeMessage}
            pendingQuestion={pendingQuestion}
            isPending={isPending}
            publicMode
          />
          <ChatComposer
            disabled={isPending}
            onSend={sendMessage}
            placeholder="Ask a question about this organization…"
          />
          <p className="public-chat-disclaimer">
            <ShieldCheck aria-hidden="true" /> Answers use published sources. Visitor conversations are not saved.
          </p>
        </div>
      </section>
      <footer className="public-assistant-footer">Powered by ChatMosaic</footer>
    </main>
  );
}
