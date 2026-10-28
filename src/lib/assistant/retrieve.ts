import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { documentChunks, documents } from "@/lib/db/schema";

export type EvidenceChunk = {
  id: string;
  content: string;
  documentId: string;
  documentName: string;
};

export async function retrieveRelevantChunks(
  userId: string,
  workspaceId: string,
  query: string,
): Promise<EvidenceChunk[]> {
  const searchVector = sql`to_tsvector('english', ${documentChunks.content})`;
  const searchQuery = sql`plainto_tsquery('english', ${query})`;
  const rank = sql<number>`ts_rank_cd(${searchVector}, ${searchQuery})`;

  return db
    .select({
      id: documentChunks.id,
      content: documentChunks.content,
      documentId: documents.id,
      documentName: documents.name,
    })
    .from(documentChunks)
    .innerJoin(
      documents,
      and(
        eq(documents.id, documentChunks.documentId),
        eq(documents.userId, documentChunks.userId),
        eq(documents.workspaceId, documentChunks.workspaceId),
      ),
    )
    .where(
      and(
        eq(documentChunks.userId, userId),
        eq(documentChunks.workspaceId, workspaceId),
        eq(documents.userId, userId),
        eq(documents.workspaceId, workspaceId),
        sql`${searchVector} @@ ${searchQuery}`,
      ),
    )
    .orderBy(desc(rank))
    .limit(5);
}
