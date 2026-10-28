const CHUNK_LENGTH = 1_800;
const CHUNK_OVERLAP = 220;

export function normalizeDocumentText(text: string): string {
  return text
    .replace(/\u0000/g, "")
    .replace(/\r\n?/g, "\n")
    .replace(/[\t ]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function chunkDocumentText(text: string): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = Math.min(start + CHUNK_LENGTH, text.length);

    if (end < text.length) {
      const paragraphBoundary = text.lastIndexOf("\n", end);
      const wordBoundary = text.lastIndexOf(" ", end);
      const boundary = paragraphBoundary > start + CHUNK_LENGTH * 0.55
        ? paragraphBoundary
        : wordBoundary;

      if (boundary > start + CHUNK_LENGTH * 0.55) {
        end = boundary;
      }
    }

    const chunk = text.slice(start, end).trim();
    if (chunk) {
      chunks.push(chunk);
    }

    if (end >= text.length) {
      break;
    }

    start = Math.max(end - CHUNK_OVERLAP, start + 1);
  }

  return chunks;
}
