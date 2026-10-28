import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { workspaces } from "@/lib/db/schema";
import type { WorkspaceSummary } from "@/lib/types";

export type WorkspaceRecord = typeof workspaces.$inferSelect;

export function toWorkspaceSummary(workspace: WorkspaceRecord): WorkspaceSummary {
  return {
    id: workspace.id,
    name: workspace.name,
    assistantName: workspace.assistantName,
    welcomeMessage: workspace.welcomeMessage,
    accentColor: workspace.accentColor,
    shareSlug: workspace.shareSlug,
    isPublic: workspace.isPublic,
    updatedAt: workspace.updatedAt.toISOString(),
  };
}

export async function getOrCreateWorkspace(userId: string): Promise<WorkspaceRecord> {
  const [existing] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.userId, userId))
    .limit(1);

  if (existing) {
    return existing;
  }

  const [created] = await db
    .insert(workspaces)
    .values({
      id: randomUUID(),
      userId,
      shareSlug: randomUUID().replaceAll("-", "").slice(0, 18),
    })
    .onConflictDoNothing({ target: workspaces.userId })
    .returning();

  if (created) {
    return created;
  }

  const [concurrentWorkspace] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.userId, userId))
    .limit(1);

  if (!concurrentWorkspace) {
    throw new Error("Workspace could not be initialized.");
  }

  return concurrentWorkspace;
}

export async function getPublicWorkspaceBySlug(slug: string): Promise<WorkspaceRecord | null> {
  const [workspace] = await db
    .select()
    .from(workspaces)
    .where(and(eq(workspaces.shareSlug, slug), eq(workspaces.isPublic, true)))
    .limit(1);

  return workspace ?? null;
}
