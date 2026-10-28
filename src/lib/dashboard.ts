import { and, count, desc, eq, gte } from "drizzle-orm";
import { db } from "@/lib/db";
import { chatMessages, documentChunks, documents } from "@/lib/db/schema";
import type { ChatMessageSummary, DashboardPayload, DocumentSummary } from "@/lib/types";
import { getOrCreateWorkspace, toWorkspaceSummary } from "@/lib/workspaces";

const PREVIEW_THREAD_ID = "preview";

export async function getDashboardPayload(userId: string): Promise<DashboardPayload> {
  const workspace = await getOrCreateWorkspace(userId);
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);

  const [documentRows, chunkCountRows, answerCountRows, messageRows] = await Promise.all([
    db
      .select({
        id: documents.id,
        name: documents.name,
        type: documents.type,
        sizeBytes: documents.sizeBytes,
        status: documents.status,
        createdAt: documents.createdAt,
      })
      .from(documents)
      .where(and(eq(documents.userId, userId), eq(documents.workspaceId, workspace.id)))
      .orderBy(desc(documents.createdAt)),
    db
      .select({ total: count() })
      .from(documentChunks)
      .where(and(eq(documentChunks.userId, userId), eq(documentChunks.workspaceId, workspace.id))),
    db
      .select({ total: count() })
      .from(chatMessages)
      .where(
        and(
          eq(chatMessages.userId, userId),
          eq(chatMessages.workspaceId, workspace.id),
          eq(chatMessages.role, "assistant"),
          gte(chatMessages.createdAt, monthStart),
        ),
      ),
    db
      .select()
      .from(chatMessages)
      .where(
        and(
          eq(chatMessages.userId, userId),
          eq(chatMessages.workspaceId, workspace.id),
          eq(chatMessages.threadId, PREVIEW_THREAD_ID),
        ),
      )
      .orderBy(desc(chatMessages.createdAt))
      .limit(40),
  ]);

  const documentSummaries: DocumentSummary[] = documentRows.map((document) => ({
    ...document,
    createdAt: document.createdAt.toISOString(),
  }));
  const messages: ChatMessageSummary[] = messageRows.reverse().map((message) => ({
    id: message.id,
    role: message.role === "user" ? "user" : "assistant",
    content: message.content,
    sourceDocuments: message.sourceDocuments,
    createdAt: message.createdAt.toISOString(),
  }));

  return {
    workspace: toWorkspaceSummary(workspace),
    documents: documentSummaries,
    stats: {
      documentCount: documentSummaries.length,
      chunkCount: chunkCountRows[0]?.total ?? 0,
      answersThisMonth: answerCountRows[0]?.total ?? 0,
    },
    messages,
  };
}
