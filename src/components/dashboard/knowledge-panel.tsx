"use client";

import { useMemo, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { Check, Download, FileText, Plus, Search, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import type { DocumentSummary } from "@/lib/types";

type KnowledgePanelProps = {
  documents: DocumentSummary[];
  onRefresh: () => Promise<unknown>;
};

type UploadResponse = {
  error?: string;
};

function formatFileSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function fileStyle(type: string) {
  if (type === "PDF") return "pdf";
  if (type === "DOC" || type === "DOCX") return "word";
  return "text";
}

export function KnowledgePanel({ documents, onRefresh }: KnowledgePanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const filteredDocuments = useMemo(
    () => documents.filter((document) => document.name.toLowerCase().includes(search.trim().toLowerCase())),
    [documents, search],
  );

  async function uploadFiles(fileList: FileList | null) {
    const selected = Array.from(fileList ?? []);
    if (!selected.length || uploading) return;

    const accepted = selected.filter((file) => /\.(pdf|docx?|txt|md)$/i.test(file.name));
    if (!accepted.length) {
      toast.error("Choose a PDF, Word, text, or Markdown file.");
      return;
    }

    setUploading(true);
    let uploaded = 0;
    const failures: string[] = [];

    for (const file of accepted) {
      const body = new FormData();
      body.append("file", file);
      try {
        const response = await fetch("/api/documents", { method: "POST", body });
        const result = (await response.json()) as UploadResponse;
        if (!response.ok) throw new Error(result.error ?? "Upload failed.");
        uploaded += 1;
      } catch (error) {
        failures.push(error instanceof Error ? error.message : "Upload failed.");
      }
    }

    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";

    if (uploaded) {
      await onRefresh();
      toast.success(`${uploaded} source${uploaded === 1 ? "" : "s"} stored privately and indexed.`);
    }
    if (failures.length) {
      toast.error(failures[0]);
    } else if (accepted.length !== selected.length) {
      toast.info("Unsupported files were skipped.");
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    void uploadFiles(event.target.files);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    void uploadFiles(event.dataTransfer.files);
  }

  async function removeDocument(document: DocumentSummary) {
    if (!window.confirm(`Remove “${document.name}” and its indexed text?`)) return;

    try {
      const response = await fetch(`/api/documents/${encodeURIComponent(document.id)}`, {
        method: "DELETE",
      });
      const result = (await response.json().catch(() => ({}))) as UploadResponse;
      if (!response.ok) throw new Error(result.error ?? "The source could not be removed.");
      await onRefresh();
      toast.success("Source removed from the knowledge base.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The source could not be removed.");
    }
  }

  return (
    <section className="documents-panel panel" aria-labelledby="sources-heading">
      <div className="panel-heading">
        <div>
          <h2 id="sources-heading">Your sources</h2>
          <p>Documents your assistant can use to answer questions</p>
        </div>
        <Button type="button" size="sm" variant="outline" disabled={uploading} onClick={() => inputRef.current?.click()}>
          <Plus data-icon="inline-start" /> {uploading ? "Uploading…" : "Add source"}
        </Button>
      </div>

      <div className="upload-zone" onDragOver={(event) => event.preventDefault()} onDrop={handleDrop}>
        <input
          ref={inputRef}
          className="sr-only"
          type="file"
          accept=".pdf,.doc,.docx,.txt,.md"
          multiple
          disabled={uploading}
          onChange={handleFileChange}
          aria-label="Upload documents"
        />
        <span className="upload-icon"><Upload aria-hidden="true" /></span>
        <div className="upload-copy">
          <strong>
            Drop files here, or{" "}
            <button type="button" disabled={uploading} onClick={() => inputRef.current?.click()}>
              browse
            </button>
          </strong>
          <span>PDF, DOC, DOCX, TXT, or Markdown · up to 20 MB each</span>
        </div>
        <span className="upload-limit">MAX 20 MB</span>
      </div>

      <div className="list-toolbar">
        <div className="list-title">ALL DOCUMENTS <span>{documents.length}</span></div>
        <label className="search-box">
          <Search aria-hidden="true" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search documents"
            aria-label="Search documents"
          />
        </label>
      </div>

      <div className="document-list">
        {filteredDocuments.length ? filteredDocuments.map((document) => (
          <div className="document-row" key={document.id}>
            <span className={`file-icon ${fileStyle(document.type)}`}><FileText aria-hidden="true" /></span>
            <span className="document-name">
              <strong>{document.name}</strong>
              <small>{document.type} <i aria-hidden="true">·</i> {formatFileSize(document.sizeBytes)}</small>
            </span>
            <Badge className="document-status" variant="secondary">
              <span className="status-dot" />{document.status === "ready" ? "Indexed" : "Processing"}
            </Badge>
            <div className="document-actions">
              <Button asChild type="button" variant="ghost" size="icon" aria-label={`Download ${document.name}`}>
                <a href={`/api/documents/${encodeURIComponent(document.id)}/file`} download={document.name}>
                  <Download aria-hidden="true" />
                </a>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Remove ${document.name}`}
                onClick={() => void removeDocument(document)}
              >
                <Trash2 aria-hidden="true" />
              </Button>
            </div>
          </div>
        )) : (
          <Empty className="documents-empty">
            <EmptyHeader>
              <EmptyMedia variant="icon"><FileText aria-hidden="true" /></EmptyMedia>
              <EmptyTitle>{search ? "No matching sources" : "Your knowledge base is ready"}</EmptyTitle>
              <EmptyDescription>
                {search
                  ? "Try a different search term."
                  : "Add a source to ground your assistant’s answers in your organization’s own information."}
              </EmptyDescription>
            </EmptyHeader>
            {!search && (
              <EmptyContent>
                <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
                  <Upload data-icon="inline-start" /> Upload your first source
                </Button>
              </EmptyContent>
            )}
          </Empty>
        )}
      </div>

      <div className="panel-footer">
        <span><Check aria-hidden="true" /> Private storage · full-text indexed</span>
        <span>{documents.length} source{documents.length === 1 ? "" : "s"} in this workspace</span>
      </div>
    </section>
  );
}
