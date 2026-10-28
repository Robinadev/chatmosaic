import { randomUUID } from "node:crypto";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, { mime: string; extensions: string[] }> = {
  "application/pdf": { mime: "application/pdf", extensions: ["pdf"] },
  "text/plain": { mime: "text/plain", extensions: ["txt", "md"] },
  "application/msword": { mime: "application/msword", extensions: ["doc"] },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    extensions: ["docx"],
  },
};

function getStorageConfig() {
  const { S3_BUCKET, S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_ENDPOINT } = process.env;
  if (!S3_BUCKET || !S3_REGION || !S3_ACCESS_KEY_ID || !S3_SECRET_ACCESS_KEY) return null;
  return {
    bucket: S3_BUCKET,
    client: new S3Client({
      region: S3_REGION,
      endpoint: S3_ENDPOINT || undefined,
      forcePathStyle: Boolean(S3_ENDPOINT),
      credentials: { accessKeyId: S3_ACCESS_KEY_ID, secretAccessKey: S3_SECRET_ACCESS_KEY },
    }),
  };
}

function hasValidSignature(bytes: Uint8Array, mime: string, extension: string) {
  if (mime === "application/pdf") return bytes.length >= 5 && new TextDecoder().decode(bytes.slice(0, 5)) === "%PDF-";
  if (extension === "docx") {
    return bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04;
  }
  if (extension === "doc") return bytes.length >= 8 && bytes[0] === 0xd0 && bytes[1] === 0xcf && bytes[2] === 0x11 && bytes[3] === 0xe0;
  if (mime === "text/plain") {
    if (!bytes.length) return false;
    for (const byte of bytes) if (byte === 0) return false;
    return true;
  }
  return false;
}

export async function POST(request: Request) {
  const storage = getStorageConfig();
  if (!storage) {
    return NextResponse.json({ error: "Document storage is not configured." }, { status: 503 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected a multipart form upload." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Choose a document to upload." }, { status: 400 });
  }
  if (!file.size || file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "Files must be between 1 byte and 20 MB." }, { status: 413 });
  }

  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const type = ALLOWED_TYPES[file.type];
  if (!type || !type.extensions.includes(extension)) {
    return NextResponse.json({ error: "Only PDF, DOC, DOCX, TXT, and Markdown files are supported." }, { status: 415 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!hasValidSignature(bytes, file.type, extension)) {
    return NextResponse.json({ error: "The file contents do not match the selected document type." }, { status: 415 });
  }

  const key = `documents/${randomUUID()}.${extension}`;
  try {
    await storage.client.send(new PutObjectCommand({
      Bucket: storage.bucket,
      Key: key,
      Body: bytes,
      ContentLength: bytes.byteLength,
      ContentType: type.mime,
      ServerSideEncryption: "AES256",
      Metadata: { originalname: encodeURIComponent(file.name.slice(0, 200)) },
    }));
  } catch (error) {
    console.error("Document storage upload failed", error);
    return NextResponse.json({ error: "The document could not be stored. Please try again." }, { status: 502 });
  }

  return NextResponse.json({
    id: key,
    name: file.name,
    size: file.size,
    type: extension.toUpperCase(),
    status: "Stored",
  }, { status: 201 });
}
