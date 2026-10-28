# Kindred — NGO knowledge-base importer

A no-code workspace concept for turning an NGO’s documents into a helpful, source-aware chatbot. Upload or drag in documents, store them in a private S3-compatible bucket through a server-side API, and try community questions in the built-in assistant preview.

> **Prototype limitation:** Uploads are stored in object storage, but the app does not yet persist a document catalog, parse document contents, or connect the preview to an AI service. The preview still uses sample answers. Add authentication, malware scanning, and document-processing/retrieval before using this with real organizational data.

## What’s in the demo

- Drag-and-drop or browse to upload PDF, DOC, DOCX, TXT, and Markdown files (20 MB maximum each).
- Uploads go through a server-side API that checks extensions, MIME types, and basic file signatures before storing objects with server-side encryption.
- Search the current-session source list and remove documents.
- Ask a question or choose a suggested prompt in the assistant preview.
- See a sample answer with its related source document.
- Responsive workspace layout with privacy and sync status cues.

## Getting started

```bash
npm install
npm run dev
```

Configure a private S3 bucket and server-only credentials in `.env.local`:

```dotenv
S3_BUCKET=your-private-bucket
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=your-server-side-access-key
S3_SECRET_ACCESS_KEY=your-server-side-secret
# Optional for S3-compatible providers such as MinIO or R2:
# S3_ENDPOINT=https://your-s3-compatible-endpoint
```

The IAM identity should have only `s3:PutObject` access to the intended bucket/prefix. Keep the bucket private, enable bucket-level encryption and public-access blocking, and never prefix these variables with `NEXT_PUBLIC_`. Restart the dev server after changing environment variables. Without storage configuration, `POST /api/documents` returns `503`.

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Upload API

`POST /api/documents` accepts `multipart/form-data` with a `file` field. It allows PDF, DOC, DOCX, TXT, and Markdown files up to 20 MB, checks the declared MIME type against the extension and basic file signatures, then writes the object under a random `documents/` key with AES256 server-side encryption. Successful responses return the opaque object key and file metadata; storage credentials and bucket URLs are never sent to the browser. Uploads are sequential in the UI, and failed uploads are removed from the current-session list.

This endpoint is a storage integration starter, not a complete production security boundary: it does not authenticate users, enforce tenant ownership, scan for malware, or persist a database record. Add those controls and configure request-size limits at the hosting/proxy layer before accepting untrusted or sensitive NGO documents.

## Turning this prototype into a real importer

1. Add authentication, authorization, tenant-scoped object keys, malware scanning, and a persistent document catalog. Enforce file-size limits at the proxy as well as in the route.
2. Extract text from supported formats, normalize it, and split it into searchable chunks. Preserve document names and page or section metadata for citations.
3. Create embeddings and store them in a tenant-isolated vector index. Apply access controls and retention/deletion policies to both source files and derived data.
4. Add a question endpoint that retrieves relevant chunks, generates a grounded answer, and returns citations. Handle unsupported questions safely rather than inventing NGO policies.
5. Replace the sample `answerFor` function in `src/app/page.tsx` with the API integration, and show real processing, failure, and sync states.
6. Add tests for upload validation, tenant isolation, source citations, deletion, and answers that have no supporting source.

## Tech stack

- [Next.js](https://nextjs.org) and React
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com)
- [Lucide](https://lucide.dev/) icons

## Project structure

- `src/app/page.tsx` — importer workspace, upload client, and interactive assistant preview
- `src/app/api/documents/route.ts` — validated server-side upload endpoint for S3-compatible storage
- `src/app/globals.css` — workspace styling and responsive layouts
- `src/app/layout.tsx` — root application layout and metadata
- `src/components/ui/` — shared UI components
