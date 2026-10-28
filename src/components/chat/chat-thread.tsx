"use client";

import { MessageScroller } from "@shadcn/react/message-scroller";
import { ArrowDown, FileText, HeartHandshake, LoaderCircle, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Bubble,
  BubbleContent,
} from "@/components/ui/bubble";
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageHeader,
} from "@/components/ui/message";
import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker";
import type { ChatMessageSummary } from "@/lib/types";
import { Button } from "@/components/ui/button";

const suggestedQuestions = [
  "What services does our organization offer?",
  "How can I get help or get involved?",
  "What should I know before I visit?",
];

type ChatThreadProps = {
  messages: ChatMessageSummary[];
  assistantName: string;
  welcomeMessage: string;
  pendingQuestion?: string;
  isPending?: boolean;
  publicMode?: boolean;
  onSuggestion?: (question: string) => void;
};

function MessageRow({
  message,
  assistantName,
  publicMode,
}: {
  message: ChatMessageSummary;
  assistantName: string;
  publicMode: boolean;
}) {
  const isUser = message.role === "user";
  const align = isUser ? "end" : "start";

  return (
    <Message align={align} className={isUser ? "chat-message-user" : "chat-message-assistant"}>
      {!isUser && (
        <MessageAvatar>
          <HeartHandshake aria-hidden="true" />
        </MessageAvatar>
      )}
      <MessageContent>
        <MessageHeader>{isUser ? "You" : assistantName}</MessageHeader>
        <Bubble variant={isUser ? "tinted" : "secondary"} align={align}>
          <BubbleContent>{message.content}</BubbleContent>
        </Bubble>
        {!isUser && message.sourceDocuments.length > 0 && (
          <MessageFooter aria-label="Sources">
            {message.sourceDocuments.map((source) => (
              <Badge className="source-chip" key={source.id} variant="outline">
                <FileText aria-hidden="true" />
                <span>{source.name}</span>
              </Badge>
            ))}
          </MessageFooter>
        )}
      </MessageContent>
    </Message>
  );
}

export function ChatThread({
  messages,
  assistantName,
  welcomeMessage,
  pendingQuestion,
  isPending = false,
  publicMode = false,
  onSuggestion,
}: ChatThreadProps) {
  const greeting: ChatMessageSummary = {
    id: "welcome-message",
    role: "assistant",
    content: welcomeMessage,
    sourceDocuments: [],
    createdAt: "",
  };

  return (
    <MessageScroller.Provider autoScroll defaultScrollPosition="end" scrollPreviousItemPeek={44}>
      <MessageScroller.Root className="message-scroller">
        <MessageScroller.Viewport
          className="message-scroller-viewport"
          role="log"
          aria-label="Assistant conversation"
          aria-live="polite"
        >
          <MessageScroller.Content className="message-scroller-content">
            <MessageScroller.Item messageId={greeting.id}>
              <MessageRow message={greeting} assistantName={assistantName} publicMode={publicMode} />
            </MessageScroller.Item>
            {messages.map((message) => (
              <MessageScroller.Item
                key={message.id}
                messageId={message.id}
                scrollAnchor={message.role === "user"}
              >
                <MessageRow message={message} assistantName={assistantName} publicMode={publicMode} />
              </MessageScroller.Item>
            ))}
            {messages.length === 0 && onSuggestion && (
              <MessageScroller.Item messageId="suggested-questions">
                <Empty className="chat-empty">
                  <EmptyHeader>
                    <EmptyMedia variant="icon"><Sparkles aria-hidden="true" /></EmptyMedia>
                    <EmptyTitle>Start with a question</EmptyTitle>
                    <EmptyDescription>
                      Ask about information covered by this organization’s uploaded sources.
                    </EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent className="suggestions">
                    {suggestedQuestions.map((question) => (
                      <Button
                        key={question}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onSuggestion(question)}
                      >
                        {question}
                      </Button>
                    ))}
                  </EmptyContent>
                </Empty>
              </MessageScroller.Item>
            )}
            {pendingQuestion && (
              <MessageScroller.Item messageId="pending-question" scrollAnchor>
                <Message align="end" className="chat-message-user">
                  <MessageContent>
                    <MessageHeader>You</MessageHeader>
                    <Bubble variant="tinted" align="end">
                      <BubbleContent>{pendingQuestion}</BubbleContent>
                    </Bubble>
                  </MessageContent>
                </Message>
              </MessageScroller.Item>
            )}
            {isPending && (
              <MessageScroller.Item messageId="assistant-thinking">
                <Message align="start" className="chat-message-assistant">
                  <MessageAvatar><HeartHandshake aria-hidden="true" /></MessageAvatar>
                  <MessageContent>
                    <MessageHeader>{assistantName}</MessageHeader>
                    <Marker role="status" className="thinking-marker">
                      <MarkerIcon><LoaderCircle className="animate-spin" /></MarkerIcon>
                      <MarkerContent>Looking through the sources…</MarkerContent>
                    </Marker>
                  </MessageContent>
                </Message>
              </MessageScroller.Item>
            )}
          </MessageScroller.Content>
        </MessageScroller.Viewport>
        <MessageScroller.Button className="scroll-latest" aria-label="Jump to latest message">
          <ArrowDown aria-hidden="true" />
        </MessageScroller.Button>
      </MessageScroller.Root>
    </MessageScroller.Provider>
  );
}
