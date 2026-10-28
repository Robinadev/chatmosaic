import { get } from "@vercel/blob";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";
import { getOrCreateWorkspace } from "@/lib/workspaces";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const runtime = "nodejs";

export async function GET(request: Request, { params }: RouteContext) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { id } = await params;
  const workspace = await getOrCreateWorkspace(user.id);
  const [document] = await db
    .select({ id: documents.id, name: documents.name, blobPathname: documents.blobPathname })
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
    const result = await get(document.blobPathname, {
      access: "private",
      ifNoneMatch: request.headers.get("if-none-match") ?? undefined,
    });

    if (!result) {
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }

    const commonHeaders = {
      ETag: result.blob.etag,
      "Cache-Control": "private, no-cache",
    };

    if (result.statusCode === 304) {
      return new Response(null, { status: 304, headers: commonHeaders });
    }

    const encodedName = encodeURIComponent(document.name.replace(/[\r\n"]/g, "_"));
    return new Response(result.stream, {
      headers: {
        ...commonHeaders,
        "Content-Type": result.blob.contentType,
        "Content-Disposition": `attachment; filename*=UTF-8''${encodedName}`,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("[documents] Download failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "The document could not be downloaded." }, { status: 502 });
  }
}
