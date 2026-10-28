import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { addDocument, getDocuments, removeDocument } from "@/lib/store";

export const runtime = "nodejs";
const maxBytes = 20 * 1024 * 1024;
const allowed = /\.(pdf|docx?|txt|md)$/i;

export async function GET() {
  const documents = await getDocuments();
  return NextResponse.json({ documents: documents.map(({ text: _text, ...document }) => document) });
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Choose a document to upload." }, { status: 400 });
    if (!allowed.test(file.name)) return NextResponse.json({ error: "Only PDF, Word, text, and Markdown files are supported." }, { status: 415 });
    if (file.size > maxBytes) return NextResponse.json({ error: "Files must be 20 MB or smaller." }, { status: 413 });
    const bytes = Buffer.from(await file.arrayBuffer());
    let text = "";
    if (/\.(txt|md)$/i.test(file.name)) text = bytes.toString("utf8");
    else if (/\.docx$/i.test(file.name)) {
      try { const mammoth = await import("mammoth"); text = (await mammoth.extractRawText({ buffer: bytes })).value; }
      catch { return NextResponse.json({ error: "Could not read this Word document." }, { status: 422 }); }
    } else if (/\.pdf$/i.test(file.name)) {
      try {
        const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
        const pdf = await pdfjs.getDocument({ data: new Uint8Array(bytes), useSystemFonts: true }).promise;
        const pages = await Promise.all(Array.from({ length: pdf.numPages }, async (_, index) => {
          const page = await pdf.getPage(index + 1);
          const content = await page.getTextContent();
          return content.items.map((item) => "str" in item ? item.str : "").join(" ");
        }));
        text = pages.join("\n");
      } catch { return NextResponse.json({ error: "Could not read this PDF. Try exporting it as text." }, { status: 422 }); }
    } else text = bytes.toString("utf8");
    if (!text.trim()) return NextResponse.json({ error: "This document contains no extractable text." }, { status: 422 });
    const document = await addDocument({ id: randomUUID(), name: file.name.slice(0, 200), size: file.size, type: file.name.split(".").pop()?.toUpperCase() ?? "FILE", text: text.slice(0, 500_000), createdAt: new Date().toISOString() });
    const { text: _text, ...publicDocument } = document;
    return NextResponse.json(publicDocument, { status: 201 });
  } catch { return NextResponse.json({ error: "Document upload failed." }, { status: 500 }); }
}

export async function DELETE(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Document ID is required." }, { status: 400 });
  await removeDocument(id);
  return NextResponse.json({ success: true });
}
