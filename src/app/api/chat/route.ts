import { randomUUID } from "node:crypto";
import { and, count, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { generateGroundedAnswer } from "@/lib/assistant/generate-answer";
import { retrieveRelevantChunks } from "@/lib/assistant/retrieve";
import { db } from "@/lib/db";
import { chatMessages, documents } from "@/lib/db/schema";
import { hasSameOrigin } from "@/lib/security/request-origin";
import { getOrCreateWorkspace } from "@/lib/workspaces";

export const runtime = "nodejs";
export const maxDuration = 60;

const messageSchema = z.object({ message: z.string().trim().min(1).max(2_000) }).strict();

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "A valid JSON request is required." }, { status: 400 });
  }

  const parsed = messageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a message of 1–2,000 characters." }, { status: 400 });
  }

  const workspace = await getOrCreateWorkspace(user.id);
  const [documentCount] = await db
    .select({ total: count() })
    .from(documents)
    .where(and(eq(documents.userId, user.id), eq(documents.workspaceId, workspace.id)));

  let answer = "";
  let sources: Array<{ id: string; name: string }> = [];

  if (!documentCount?.total) {
    answer = "I don’t have any sources to reference yet. Add a document to the knowledge base, then ask me again.";
  } else {
    const evidence = await retrieveRelevantChunks(user.id, workspace.id, parsed.data.message);
    if (!evidence.length) {
      answer = "I couldn’t find an answer to that in the uploaded sources. Try asking another way or contact your organization directly.";
    } else {
      try {
        const generated = await generateGroundedAnswer(workspace.name, parsed.data.message, evidence);
        answer = generated.text;
        sources = generated.sources;
      } catch (error) {
        console.error("[chat] Answer generation failed", error instanceof Error ? error.message : "Unknown error");
        return NextResponse.json(
          { error: "The assistant could not finish that response. Please try again." },
          { status: 503 },
        );
      }
    }
  }

  const createdAt = new Date();
  const userMessage = {
    id: randomUUID(),
    userId: user.id,
    workspaceId: workspace.id,
    threadId: "preview",
    role: "user",
    content: parsed.data.message,
    sourceDocuments: [],
    createdAt,
  };
  const assistantMessage = {
    id: randomUUID(),
    userId: user.id,
    workspaceId: workspace.id,
    threadId: "preview",
    role: "assistant",
    content: answer,
    sourceDocuments: sources,
    createdAt: new Date(createdAt.getTime() + 1),
  };

  try {
    await db.insert(chatMessages).values([userMessage, assistantMessage]);
  } catch (error) {
    console.error("[chat] Conversation save failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "The response could not be saved. Please try again." }, { status: 500 });
  }

  return NextResponse.json(
    {
      messages: [
        {
          id: userMessage.id,
          role: "user",
          content: userMessage.content,
          sourceDocuments: [],
          createdAt: userMessage.createdAt.toISOString(),
        },
        {
          id: assistantMessage.id,
          role: "assistant",
          content: assistantMessage.content,
          sourceDocuments: assistantMessage.sourceDocuments,
          createdAt: assistantMessage.createdAt.toISOString(),
        },
      ],
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
