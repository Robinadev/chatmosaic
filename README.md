# Kindred — NGO knowledge-base importer

A no-code workspace concept for turning an NGO’s documents into a helpful, source-aware chatbot. Upload or drag in documents, keep track of your sources, and try community questions in the built-in assistant preview.

> **Demo note:** The current importer is a front-end prototype. Uploaded files are listed in the current browser session; their contents are not uploaded, parsed, or sent to an AI service. The preview uses sample answers for volunteer, emergency, and health questions. Connect a secure document-processing and retrieval backend before using it with real organizational data.

## What’s in the demo

- Drag-and-drop or browse to add PDF, DOC, DOCX, TXT, and Markdown files.
- Search the source list and remove documents.
- Ask a question or choose a suggested prompt in the assistant preview.
- See a sample answer with its related source document.
- Responsive workspace layout with privacy and sync status cues.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Turning this prototype into a real importer

1. Add an authenticated upload endpoint and private object storage. Enforce file-size limits, validate file signatures (not just extensions), and scan uploads for malware.
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

- `src/app/page.tsx` — importer workspace and interactive assistant preview
- `src/app/globals.css` — workspace styling and responsive layouts
- `src/app/layout.tsx` — root application layout and metadata
- `src/components/ui/` — shared UI components
