import type { SourceDocumentReference } from "@/lib/db/schema";

export type WorkspaceSummary = {
  id: string;
  name: string;
  assistantName: string;
  welcomeMessage: string;
  accentColor: string;
  shareSlug: string;
  isPublic: boolean;
  updatedAt: string;
};

export type DocumentSummary = {
  id: string;
  name: string;
  type: string;
  sizeBytes: number;
  status: string;
  createdAt: string;
};

export type ChatMessageSummary = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sourceDocuments: SourceDocumentReference[];
  createdAt: string;
};

export type DashboardPayload = {
  workspace: WorkspaceSummary;
  documents: DocumentSummary[];
  stats: {
    documentCount: number;
    chunkCount: number;
    answersThisMonth: number;
  };
  messages: ChatMessageSummary[];
};
