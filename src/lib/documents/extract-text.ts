import { Buffer } from "node:buffer";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import WordExtractor from "word-extractor";

export type SupportedDocumentExtension = "pdf" | "doc" | "docx" | "txt" | "md";

export async function extractDocumentText(
  extension: SupportedDocumentExtension,
  bytes: Uint8Array,
): Promise<string> {
  if (extension === "pdf") {
    const parser = new PDFParse({ data: bytes });
    try {
      const result = await parser.getText();
      return result.text;
    } finally {
      await parser.destroy();
    }
  }

  if (extension === "docx") {
    const result = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
    return result.value;
  }

  if (extension === "doc") {
    const extractor = new WordExtractor();
    const document = await extractor.extract(Buffer.from(bytes));
    return document.getBody();
  }

  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}
