import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { workspaces } from "@/lib/db/schema";
import { hasSameOrigin } from "@/lib/security/request-origin";
import { getOrCreateWorkspace, toWorkspaceSummary } from "@/lib/workspaces";

export const runtime = "nodejs";

const settingsSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    assistantName: z.string().trim().min(2).max(60).optional(),
    welcomeMessage: z.string().trim().min(5).max(400).optional(),
    accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    isPublic: z.boolean().optional(),
  })
  .strict()
  .refine((settings) => Object.values(settings).some((value) => value !== undefined));

export async function PATCH(request: Request) {
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

  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Check the settings and try again." }, { status: 400 });
  }

  const workspace = await getOrCreateWorkspace(user.id);
  const [updated] = await db
    .update(workspaces)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(and(eq(workspaces.id, workspace.id), eq(workspaces.userId, user.id)))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
  }

  return NextResponse.json(
    { workspace: toWorkspaceSummary(updated) },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
