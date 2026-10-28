import { and, desc, eq } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { chatMessages, documents } from "@/lib/db/schema";
import { getOrCreateWorkspace, toWorkspaceSummary } from "@/lib/workspaces";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const workspace = await getOrCreateWorkspace(user.id);
  const [documentRows, messageRows] = await Promise.all([
    db
      .select({
        id: documents.id,
        name: documents.name,
        type: documents.type,
        sizeBytes: documents.sizeBytes,
        extractedText: documents.extractedText,
        createdAt: documents.createdAt,
      })
      .from(documents)
      .where(and(eq(documents.userId, user.id), eq(documents.workspaceId, workspace.id)))
      .orderBy(desc(documents.createdAt)),
    db
      .select({
        id: chatMessages.id,
        threadId: chatMessages.threadId,
        role: chatMessages.role,
        content: chatMessages.content,
        sourceDocuments: chatMessages.sourceDocuments,
        createdAt: chatMessages.createdAt,
      })
      .from(chatMessages)
      .where(and(eq(chatMessages.userId, user.id), eq(chatMessages.workspaceId, workspace.id)))
      .orderBy(desc(chatMessages.createdAt)),
  ]);

  const exportData = {
    exportedAt: new Date().toISOString(),
    workspace: toWorkspaceSummary(workspace),
    documents: documentRows.map((document) => ({
      ...document,
      createdAt: document.createdAt.toISOString(),
    })),
    conversations: messageRows.map((message) => ({
      ...message,
      createdAt: message.createdAt.toISOString(),
    })),
  };
  const date = new Date().toISOString().slice(0, 10);

  return new Response(JSON.stringify(exportData, null, 2), {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": `attachment; filename="chatmosaic-export-${date}.json"`,
      "Content-Type": "application/json; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
