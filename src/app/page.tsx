"use client";

import { ChangeEvent, FormEvent, useRef, useState } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronDown,
  CircleHelp,
  FileText,
  Globe2,
  HeartHandshake,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  Upload,
  X,
} from "lucide-react";

type DocumentItem = { id?: string; name: string; size: string; type: string; status: "Stored" | "Uploading" };
type ChatMessage = { role: "user" | "assistant"; text: string; source?: string };

const suggestedQuestions = [
  "How can I become a volunteer?",
  "What should I do in an emergency?",
  "Where can I find health resources?",
];

function formatSize(bytes: number) {
  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function answerFor(question: string, documents: DocumentItem[]) {
  const normalized = question.toLowerCase();
  if (normalized.includes("volunteer")) {
    return {
      text: "We’d love to have you involved. Start by completing the volunteer interest form, then our local coordinator will reach out to talk about orientation and the roles available in your community.",
      source: documents.find((doc) => doc.name.toLowerCase().includes("volunteer"))?.name ?? "Volunteer handbook.pdf",
    };
  }
  if (normalized.includes("emergency") || normalized.includes("response")) {
    return {
      text: "If there’s immediate danger, contact your local emergency services first. Move to a safe location, follow instructions from local authorities, and check in with your community response coordinator when it’s safe to do so.",
      source: documents.find((doc) => doc.name.toLowerCase().includes("emergency"))?.name ?? "Emergency response plan.docx",
    };
  }
  if (normalized.includes("health") || normalized.includes("resource")) {
    return {
      text: "Our community health team can connect you with local clinics, health education sessions, and family support. Contact your nearest community hub to find the services available in your area.",
      source: documents.find((doc) => doc.name.toLowerCase().includes("health"))?.name ?? "Community health guide.pdf",
    };
  }
  return {
    text: documents.length
      ? `I found a few resources that may help. Try asking about volunteering, emergency response, or community health. I can only answer from the ${documents.length} documents in this knowledge base.`
      : "Add a document to your knowledge base first, and I’ll be ready to help answer questions from it.",
    source: documents[0]?.name,
  };
}

export default function Home() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("Knowledge base");
  const [notice, setNotice] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  async function addFiles(files: FileList | null) {
    if (!files?.length || uploading) return;
    setNotice("");
    const selected = Array.from(files);
    const accepted = selected.filter((file) => /\.(pdf|docx?|txt|md)$/i.test(file.name));
    if (!accepted.length) {
      setNotice("Please choose a PDF, Word, or text document.");
      return;
    }

    setUploading(true);
    let uploaded = 0;
    const failures: string[] = [];
    for (const file of accepted) {
      const temporaryId = `upload-${crypto.randomUUID()}`;
      setDocuments((current) => [{
        id: temporaryId,
        name: file.name,
        size: formatSize(file.size),
        type: file.name.split(".").pop()?.toUpperCase() ?? "FILE",
        status: "Uploading",
      }, ...current]);
      try {
        const body = new FormData();
        body.append("file", file);
        const response = await fetch("/api/documents", { method: "POST", body });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Upload failed.");
        setDocuments((current) => current.map((doc) => doc.id === temporaryId
          ? { id: result.id, name: result.name, size: formatSize(result.size), type: result.type, status: "Stored" }
          : doc));
        uploaded += 1;
      } catch (error) {
        setDocuments((current) => current.filter((doc) => doc.id !== temporaryId));
        failures.push(error instanceof Error ? error.message : "Upload failed.");
      }
    }
    setUploading(false);
    if (fileInput.current) fileInput.current.value = "";
    if (failures.length) setNotice(failures[0]);
    else if (accepted.length !== selected.length) setNotice(`${uploaded} document${uploaded === 1 ? "" : "s"} stored. Unsupported files were skipped.`);
    else setNotice(`${uploaded} document${uploaded === 1 ? "" : "s"} securely stored.`);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    addFiles(event.target.files);
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    addFiles(event.dataTransfer.files);
  }

  function askQuestion(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;
    const answer = answerFor(trimmed, documents);
    setMessages((current) => [
      ...current,
      { role: "user", text: trimmed },
      { role: "assistant", text: answer.text, source: answer.source },
    ]);
    setQuestion("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    askQuestion(question);
  }

  const visibleDocuments = documents.filter((doc) => doc.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#home" aria-label="Kindred home">
          <span className="brand-mark"><HeartHandshake size={21} strokeWidth={2.2} /></span>
          <span>kindred<span className="brand-period">.</span></span>
        </a>
        <div className="workspace-switcher">
          <span className="workspace-avatar">G</span>
          <span className="workspace-copy"><strong>Greenway Aid</strong><small>Free workspace</small></span>
          <ChevronDown size={15} />
        </div>
        <div className="side-label">WORKSPACE</div>
        <nav className="side-nav" aria-label="Workspace navigation">
          <button className={`nav-item ${activeTab === "Knowledge base" ? "active" : ""}`} onClick={() => setActiveTab("Knowledge base")}><BookOpen size={17} />Knowledge base<span className="nav-count">{documents.length}</span></button>
          <button className={`nav-item ${activeTab === "Chat preview" ? "active" : ""}`} onClick={() => setActiveTab("Chat preview")}><MessageCircle size={17} />Chat preview</button>
          <button className={`nav-item ${activeTab === "Settings" ? "active" : ""}`} onClick={() => setActiveTab("Settings")}><Settings2 size={17} />Settings</button>
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card"><span className="help-icon"><CircleHelp size={17} /></span><strong>Need a hand?</strong><p>We’re here to help you get set up.</p><a href="mailto:hello@kindred.org">Visit help center <ArrowUpRight size={13} /></a></div>
          <button className="profile-button"><span className="profile-avatar">AM</span><span className="profile-copy"><strong>Alex Morgan</strong><small>Workspace admin</small></span><MoreHorizontal size={18} /></button>
        </div>
      </aside>

      <section className="main-area" id="home">
        <header className="topbar"><div className="breadcrumb">Greenway Aid <span>/</span> <strong>{activeTab}</strong></div><div className="topbar-right"><span className="secure-label"><ShieldCheck size={15} /> Your data is private</span><button className="icon-button" aria-label="Open settings" onClick={() => setActiveTab("Settings")}><Settings2 size={18} /></button></div></header>
        <div className="content-wrap">
          <div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-dot" /> YOUR AI ASSISTANT</div><h1>Knowledge base</h1><p className="page-subtitle">Teach your assistant about your work, one document at a time.</p></div><button className="share-button" onClick={() => setNotice("Your assistant preview link is ready to share.")}><ArrowUpRight size={15} /> Share assistant</button></div>

          <div className="overview-row">
            <div className="overview-card"><span className="overview-icon green"><BookOpen size={18} /></span><div><span className="overview-label">DOCUMENTS</span><strong>{documents.length.toString().padStart(2, "0")}</strong></div><span className="overview-note"><span className="live-dot" /> Up to date</span></div>
            <div className="overview-card"><span className="overview-icon lilac"><Sparkles size={18} /></span><div><span className="overview-label">KNOWLEDGE CHUNKS</span><strong>{(documents.length * 24).toString()}</strong></div><span className="overview-note">Across all sources</span></div>
            <div className="overview-card"><span className="overview-icon peach"><MessageCircle size={18} /></span><div><span className="overview-label">ANSWERS THIS MONTH</span><strong>128</strong></div><span className="overview-note trend">↗ 18% this week</span></div>
          </div>

          <div className="workspace-grid">
            <section className="documents-panel panel">
              <div className="panel-heading"><div><h2>Your sources</h2><p>Documents your assistant learns from</p></div><button className="small-add-button" disabled={uploading} onClick={() => fileInput.current?.click()}><Plus size={15} /> {uploading ? "Uploading…" : "Add source"}</button></div>
              <div className="upload-zone" onDragOver={(event) => event.preventDefault()} onDrop={handleDrop}>
                <input ref={fileInput} className="file-input" type="file" accept=".pdf,.doc,.docx,.txt,.md" multiple disabled={uploading} onChange={handleFileChange} aria-label="Upload documents" />
                <span className="upload-icon"><Upload size={19} /></span><div className="upload-copy"><strong>Drop your files here, or <button disabled={uploading} onClick={() => fileInput.current?.click()}>browse</button></strong><span>PDF, DOC, DOCX, TXT, or Markdown · Up to 20 MB each</span></div><span className="upload-limit">MAX 20 MB</span>
              </div>
              {notice && <div className="notice" role="status"><Check size={15} />{notice}<button aria-label="Dismiss notification" onClick={() => setNotice("")}><X size={14} /></button></div>}
              <div className="list-toolbar"><div className="list-title">ALL DOCUMENTS <span>{documents.length}</span></div><label className="search-box"><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search documents" aria-label="Search documents" /></label></div>
              <div className="document-list">{visibleDocuments.length ? visibleDocuments.map((doc, index) => <div className="document-row" key={`${doc.name}-${index}`}><span className={`file-icon ${doc.type === "PDF" ? "pdf" : doc.type === "DOCX" || doc.type === "DOC" ? "word" : "text"}`}><FileText size={17} /></span><span className="document-name"><strong>{doc.name}</strong><small>{doc.type} <i>·</i> {doc.size}</small></span><span className={`status-pill ${doc.status === "Uploading" ? "uploading" : ""}`}><span />{doc.status}</span><button className="row-menu" aria-label={`Remove ${doc.name}`} onClick={() => setDocuments((current) => current.filter((item) => item !== doc))}><MoreHorizontal size={18} /></button></div>) : <div className="empty-state">No documents match “{search}”.</div>}</div>
              <div className="panel-footer"><span><Check size={14} /> All changes saved</span><button onClick={() => setNotice("Your knowledge base is synced and ready.")}>View sync details <ArrowRight size={13} /></button></div>
            </section>

            <section className="chat-panel panel">
              <div className="chat-heading"><div><span className="chat-heading-icon"><Sparkles size={16} /></span><div><h2>Try your assistant</h2><p>See what your community will see</p></div></div><button className="chat-menu" aria-label="Chat options"><MoreHorizontal size={19} /></button></div>
              <div className="chat-body">
                <div className="assistant-intro"><span className="assistant-avatar"><HeartHandshake size={19} /></span><div><strong>Hi there! <span>👋</span></strong><p>I’m here to help with questions about Greenway Aid. What would you like to know?</p></div></div>
                {messages.map((message, index) => <div className={`message ${message.role}`} key={`${message.role}-${index}`}><div className="message-bubble">{message.text}{message.source && message.role === "assistant" && <span className="source-chip"><FileText size={12} /> {message.source}</span>}</div></div>)}
                {messages.length === 0 && <div className="suggestions"><span>TRY ASKING</span>{suggestedQuestions.map((suggestion) => <button key={suggestion} onClick={() => askQuestion(suggestion)}>{suggestion}<ArrowUpRight size={13} /></button>)}</div>}
              </div>
              <form className="chat-input-wrap" onSubmit={handleSubmit}><input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask a question..." aria-label="Ask your assistant a question" /><button type="submit" aria-label="Send question" disabled={!question.trim()}><Send size={16} /></button></form>
              <div className="chat-disclaimer"><Sparkles size={12} /> Answers are generated from your uploaded sources <span>·</span> <button onClick={() => setNotice("Your assistant only uses the sources you add here.")}>Learn more</button></div>
            </section>
          </div>

          <div className="bottom-note"><span className="bottom-note-icon"><Globe2 size={16} /></span><span><strong>Made for the work that matters.</strong> Your assistant is grounded in your organization’s knowledge, so your community gets answers they can trust.</span><button onClick={() => setNotice("Your assistant is ready to help your community.")}>How it works <ArrowRight size={14} /></button></div>
          <footer className="page-footer"><span>© 2025 Kindred AI</span><span>Built with care for communities everywhere <span className="footer-heart">♥</span></span><button onClick={() => setNotice("Your knowledge base is private and only used to answer your community’s questions.")}><ShieldCheck size={13} /> Privacy first</button><button onClick={() => setNotice("Your assistant is ready to help your community.")}><ArrowDownToLine size={13} /> Export data</button></footer>
        </div>
      </section>
    </main>
  );
}
