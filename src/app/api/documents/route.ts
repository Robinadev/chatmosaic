import { randomUUID } from "node:crypto";
import { del, put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { documentChunks, documents } from "@/lib/db/schema";
import { chunkDocumentText, normalizeDocumentText } from "@/lib/documents/chunk-text";
import {
  extractDocumentText,
  type SupportedDocumentExtension,
} from "@/lib/documents/extract-text";
import { getSessionUser } from "@/lib/auth/session";
import { hasSameOrigin } from "@/lib/security/request-origin";
import { getOrCreateWorkspace } from "@/lib/workspaces";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const MAX_TEXT_LENGTH = 500_000;

const fileTypes: Record<
  SupportedDocumentExtension,
  { mime: string; acceptedMimeTypes: string[] }
> = {
  pdf: { mime: "application/pdf", acceptedMimeTypes: ["application/pdf", "application/octet-stream"] },
  doc: { mime: "application/msword", acceptedMimeTypes: ["application/msword", "application/octet-stream"] },
  docx: {
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    acceptedMimeTypes: [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/zip",
      "application/octet-stream",
    ],
  },
  txt: { mime: "text/plain", acceptedMimeTypes: ["text/plain", "application/octet-stream"] },
  md: { mime: "text/markdown", acceptedMimeTypes: ["text/markdown", "text/plain", "application/octet-stream"] },
};

function hasValidSignature(bytes: Uint8Array, extension: SupportedDocumentExtension) {
  if (extension === "pdf") {
    return bytes.length >= 5 && new TextDecoder().decode(bytes.slice(0, 5)) === "%PDF-";
  }
  if (extension === "docx") {
    return bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04;
  }
  if (extension === "doc") {
    return bytes.length >= 8 && bytes[0] === 0xd0 && bytes[1] === 0xcf && bytes[2] === 0x11 && bytes[3] === 0xe0;
  }
  return bytes.length > 0 && !bytes.some((byte) => byte === 0);
}

function cleanFileName(name: string) {
  return name.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, 180) || "Document";
}

export async function POST(request: Request) {
  if (!hasSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected a multipart document upload." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Choose a document to upload." }, { status: 400 });
  }
  if (!file.size || file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "Files must be between 1 byte and 20 MB." }, { status: 413 });
  }

  const extension = file.name.split(".").pop()?.toLowerCase() as SupportedDocumentExtension;
  const fileType = fileTypes[extension];
  if (!fileType || (file.type && !fileType.acceptedMimeTypes.includes(file.type))) {
    return NextResponse.json(
      { error: "Only matching PDF, DOC, DOCX, TXT, or Markdown files are supported." },
      { status: 415 },
    );
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!hasValidSignature(bytes, extension)) {
    return NextResponse.json({ error: "The file contents do not match its extension." }, { status: 415 });
  }

  let extractedText: string;
  try {
    extractedText = normalizeDocumentText(await extractDocumentText(extension, bytes));
  } catch {
    return NextResponse.json(
      { error: "This document could not be read. Check that it is not damaged or password-protected." },
      { status: 422 },
    );
  }

  if (!extractedText) {
    return NextResponse.json({ error: "No readable text was found in this document." }, { status: 422 });
  }
  if (extractedText.length > MAX_TEXT_LENGTH) {
    return NextResponse.json({ error: "This document contains too much text to index." }, { status: 413 });
  }

  const chunks = chunkDocumentText(extractedText);
  if (!chunks.length) {
    return NextResponse.json({ error: "No readable text was found in this document." }, { status: 422 });
  }

  const workspace = await getOrCreateWorkspace(user.id);
  const id = randomUUID();
  const pathname = `documents/${user.id}/${id}.${extension}`;
  let storedPathname: string | undefined;

  try {
    const blob = await put(pathname, file, {
      access: "private",
      addRandomSuffix: false,
      contentType: fileType.mime,
    });
    storedPathname = blob.pathname;

    await db.transaction(async (transaction) => {
      await transaction.insert(documents).values({
        id,
        userId: user.id,
        workspaceId: workspace.id,
        name: cleanFileName(file.name),
        type: extension.toUpperCase(),
        sizeBytes: file.size,
        blobPathname: blob.pathname,
        extractedText,
        status: "ready",
      });

      await transaction.insert(documentChunks).values(
        chunks.map((content, chunkIndex) => ({
          id: randomUUID(),
          userId: user.id,
          workspaceId: workspace.id,
          documentId: id,
          chunkIndex,
          content,
        })),
      );
    });
  } catch (error) {
    if (storedPathname) {
      await del(storedPathname).catch(() => undefined);
    }
    console.error("[documents] Upload failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "The document could not be stored. Please try again." }, { status: 502 });
  }

  return NextResponse.json(
    {
      id,
      name: cleanFileName(file.name),
      type: extension.toUpperCase(),
      sizeBytes: file.size,
      status: "ready",
      createdAt: new Date().toISOString(),
    },
    { status: 201, headers: { "Cache-Control": "private, no-store" } },
  );
}
