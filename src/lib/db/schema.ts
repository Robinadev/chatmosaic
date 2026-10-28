import { sql } from "drizzle-orm";
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export type SourceDocumentReference = {
  id: string;
  name: string;
};

export const workspaces = pgTable(
  "workspaces",
  {
    id: text("id").primaryKey(),
    userId: text("userId").notNull(),
    name: text("name").notNull().default("Greenway Aid"),
    assistantName: text("assistantName").notNull().default("Greenway Aid assistant"),
    welcomeMessage: text("welcomeMessage")
      .notNull()
      .default("Hi there! Ask me anything about Greenway Aid."),
    accentColor: text("accentColor").notNull().default("#477b5d"),
    shareSlug: text("shareSlug").notNull(),
    isPublic: boolean("isPublic").notNull().default(false),
    createdAt: timestamp("createdAt", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updatedAt", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userIdKey: uniqueIndex("workspaces_userId_key").on(table.userId),
    shareSlugKey: uniqueIndex("workspaces_shareSlug_key").on(table.shareSlug),
  }),
);

export const documents = pgTable(
  "documents",
  {
    id: text("id").primaryKey(),
    userId: text("userId").notNull(),
    workspaceId: text("workspaceId").notNull(),
    name: text("name").notNull(),
    type: text("type").notNull(),
    sizeBytes: integer("sizeBytes").notNull(),
    blobPathname: text("blobPathname").notNull(),
    extractedText: text("extractedText").notNull(),
    status: text("status").notNull().default("ready"),
    createdAt: timestamp("createdAt", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    blobPathnameKey: uniqueIndex("documents_blobPathname_key").on(table.blobPathname),
  }),
);

export const documentChunks = pgTable(
  "document_chunks",
  {
    id: text("id").primaryKey(),
    userId: text("userId").notNull(),
    workspaceId: text("workspaceId").notNull(),
    documentId: text("documentId").notNull(),
    chunkIndex: integer("chunkIndex").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("createdAt", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    documentChunkKey: uniqueIndex("document_chunks_documentId_chunkIndex_key").on(
      table.documentId,
      table.chunkIndex,
    ),
  }),
);

export const chatMessages = pgTable("chat_messages", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull(),
  workspaceId: text("workspaceId").notNull(),
  threadId: text("threadId").notNull().default("preview"),
  role: text("role").notNull(),
  content: text("content").notNull(),
  sourceDocuments: jsonb("sourceDocuments")
    .$type<SourceDocumentReference[]>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  createdAt: timestamp("createdAt", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
});
