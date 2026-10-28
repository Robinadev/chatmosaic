import { del } from "@vercel/blob";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { documentChunks, documents } from "@/lib/db/schema";
import { hasSameOrigin } from "@/lib/security/request-origin";
import { getOrCreateWorkspace } from "@/lib/workspaces";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const runtime = "nodejs";

export async function DELETE(request: Request, { params }: RouteContext) {
  if (!hasSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { id } = await params;
  const workspace = await getOrCreateWorkspace(user.id);
  const [document] = await db
    .select({ id: documents.id, blobPathname: documents.blobPathname })
    .from(documents)
    .where(
      and(
        eq(documents.id, id),
        eq(documents.userId, user.id),
        eq(documents.workspaceId, workspace.id),
      ),
    )
    .limit(1);

  if (!document) {
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  }

  try {
    await del(document.blobPathname);
    await db.transaction(async (transaction) => {
      await transaction
        .delete(documentChunks)
        .where(
          and(
            eq(documentChunks.documentId, document.id),
            eq(documentChunks.userId, user.id),
            eq(documentChunks.workspaceId, workspace.id),
          ),
        );
      await transaction
        .delete(documents)
        .where(
          and(
            eq(documents.id, document.id),
            eq(documents.userId, user.id),
            eq(documents.workspaceId, workspace.id),
          ),
        );
    });
  } catch (error) {
    console.error("[documents] Delete failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "The document could not be removed. Please try again." }, { status: 502 });
  }

  return new Response(null, { status: 204 });
}
