"use client";

import { useState } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import {
  ArrowDownToLine,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronDown,
  CircleHelp,
  HeartHandshake,
  MessageCircle,
  Settings2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { ChatPanel } from "@/components/chat/chat-panel";
import { KnowledgePanel } from "@/components/dashboard/knowledge-panel";
import { SettingsPanel, type WorkspaceUpdate } from "@/components/dashboard/settings-panel";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import type { DashboardPayload, WorkspaceSummary } from "@/lib/types";
import type { SessionUser } from "@/lib/auth/session";

type DashboardView = "Knowledge base" | "Chat preview" | "Settings";

type WorkspaceDashboardProps = {
  initialData: DashboardPayload;
  user: SessionUser;
};

async function fetchDashboard(url: string): Promise<DashboardPayload> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error("Dashboard could not be refreshed.");
  return response.json() as Promise<DashboardPayload>;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "U";
}

function StatCard({
  icon,
  label,
  value,
  note,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  note: string;
  tone: string;
}) {
  return (
    <div className="overview-card">
      <span className={`overview-icon ${tone}`}>{icon}</span>
      <div>
        <span className="overview-label">{label}</span>
        <strong>{value}</strong>
      </div>
      <span className="overview-note">{note}</span>
    </div>
  );
}

export function WorkspaceDashboard({ initialData, user }: WorkspaceDashboardProps) {
  const router = useRouter();
  const [activeView, setActiveView] = useState<DashboardView>("Knowledge base");
  const [sharing, setSharing] = useState(false);
  const { data, error, mutate } = useSWR<DashboardPayload>("/api/dashboard", fetchDashboard, {
    fallbackData: initialData,
    revalidateOnFocus: false,
  });
  const dashboard = data ?? initialData;

  async function updateWorkspace(changes: WorkspaceUpdate): Promise<WorkspaceSummary> {
    const response = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(changes),
    });
    const result = (await response.json()) as { workspace?: WorkspaceSummary; error?: string };
    if (!response.ok || !result.workspace) {
      throw new Error(result.error ?? "Workspace settings could not be saved.");
    }

    await mutate((current) => current ? { ...current, workspace: result.workspace! } : current, false);
    return result.workspace;
  }

  async function shareAssistant() {
    if (sharing) return;
    if (!dashboard.workspace.isPublic) {
      const confirmed = window.confirm(
        "Anyone with the assistant link will be able to ask questions using the sources you publish. Continue?",
      );
      if (!confirmed) return;
    }

    setSharing(true);
    try {
      const workspace = dashboard.workspace.isPublic
        ? dashboard.workspace
        : await updateWorkspace({ isPublic: true });
      const url = `${window.location.origin}/assistant/${workspace.shareSlug}`;
      try {
        await navigator.clipboard.writeText(url);
        toast.success("Assistant link copied.");
      } catch {
        toast.info("Assistant link is ready", { description: url });
      }
    } catch (shareError) {
      toast.error(shareError instanceof Error ? shareError.message : "The assistant could not be shared.");
    } finally {
      setSharing(false);
    }
  }

  async function signOut() {
    try {
      const result = await authClient.signOut();
      if (result.error) {
        toast.error("We couldn’t sign you out. Please try again.");
        return;
      }
      router.replace("/auth/sign-in");
      router.refresh();
    } catch {
      toast.error("We couldn’t sign you out. Please try again.");
    }
  }

  const headingCopy = {
    "Knowledge base": "Teach your assistant about your work, one source at a time.",
    "Chat preview": "Test how your uploaded sources answer real questions.",
    Settings: "Personalize the assistant and control how it is shared.",
  }[activeView];
  const displayName = user.name.trim() || user.email.split("@")[0] || "Workspace member";

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#home" aria-label="ChatMosaic home">
          <span className="brand-mark"><HeartHandshake aria-hidden="true" /></span>
          <span>ChatMosaic<span className="brand-period">.</span></span>
        </a>
        <div className="workspace-switcher">
          <span className="workspace-avatar">{initials(dashboard.workspace.name)}</span>
          <span className="workspace-copy">
            <strong>{dashboard.workspace.name}</strong>
            <small>Private workspace</small>
          </span>
          <ChevronDown aria-hidden="true" />
        </div>
        <div className="side-label">WORKSPACE</div>
        <nav className="side-nav" aria-label="Workspace navigation">
          <button
            className={`nav-item ${activeView === "Knowledge base" ? "active" : ""}`}
            type="button"
            aria-current={activeView === "Knowledge base" ? "page" : undefined}
            title="Knowledge base"
            onClick={() => setActiveView("Knowledge base")}
          >
            <BookOpen aria-hidden="true" /> Knowledge base <span className="nav-count">{dashboard.stats.documentCount}</span>
          </button>
          <button
            className={`nav-item ${activeView === "Chat preview" ? "active" : ""}`}
            type="button"
            aria-current={activeView === "Chat preview" ? "page" : undefined}
            title="Chat preview"
            onClick={() => setActiveView("Chat preview")}
          >
            <MessageCircle aria-hidden="true" /> Chat preview
          </button>
          <button
            className={`nav-item ${activeView === "Settings" ? "active" : ""}`}
            type="button"
            aria-current={activeView === "Settings" ? "page" : undefined}
            title="Settings"
            onClick={() => setActiveView("Settings")}
          >
            <Settings2 aria-hidden="true" /> Settings
          </button>
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card">
            <span className="help-icon"><CircleHelp aria-hidden="true" /></span>
            <strong>Private by default</strong>
            <p>Your files stay in this workspace until you publish an assistant.</p>
          </div>
          <div className="profile-button">
            <span className="profile-avatar">{initials(displayName)}</span>
            <span className="profile-copy">
              <strong>{displayName}</strong>
              <small>{user.email}</small>
            </span>
            <Button type="button" variant="ghost" size="sm" onClick={() => void signOut()}>
              Sign out
            </Button>
          </div>
        </div>
      </aside>

      <section className="main-area" id="home">
        <header className="topbar">
          <div className="breadcrumb">
            {dashboard.workspace.name} <span aria-hidden="true">/</span> <strong>{activeView}</strong>
          </div>
          <div className="topbar-right">
            <span className="secure-label"><ShieldCheck aria-hidden="true" /> Documents private by default</span>
            <Button type="button" size="sm" variant="outline" disabled={sharing} onClick={() => void shareAssistant()}>
              <ArrowUpRight data-icon="inline-start" /> {sharing ? "Preparing link…" : dashboard.workspace.isPublic ? "Copy assistant link" : "Share assistant"}
            </Button>
          </div>
        </header>

        <div className="content-wrap">
          <div className="page-heading">
            <div>
              <div className="eyebrow"><span className="eyebrow-dot" /> YOUR COMMUNITY ASSISTANT</div>
              <h1>{activeView}</h1>
              <p className="page-subtitle">{headingCopy}</p>
            </div>
            {error && <span className="refresh-warning" role="status">Showing the last saved workspace data.</span>}
          </div>

          <div className="overview-row" aria-label="Workspace overview">
            <StatCard
              icon={<BookOpen aria-hidden="true" />}
              label="DOCUMENTS"
              value={String(dashboard.stats.documentCount).padStart(2, "0")}
              note="Private sources"
              tone="green"
            />
            <StatCard
              icon={<Sparkles aria-hidden="true" />}
              label="KNOWLEDGE CHUNKS"
              value={dashboard.stats.chunkCount.toLocaleString()}
              note="Full-text indexed"
              tone="lilac"
            />
            <StatCard
              icon={<MessageCircle aria-hidden="true" />}
              label="ANSWERS THIS MONTH"
              value={dashboard.stats.answersThisMonth.toLocaleString()}
              note="Saved preview answers"
              tone="peach"
            />
          </div>

          {activeView === "Knowledge base" && (
            <div className="workspace-grid">
              <KnowledgePanel documents={dashboard.documents} onRefresh={() => mutate()} />
              <ChatPanel dashboard={dashboard} onRefresh={() => mutate()} />
            </div>
          )}
          {activeView === "Chat preview" && (
            <ChatPanel dashboard={dashboard} onRefresh={() => mutate()} expanded />
          )}
          {activeView === "Settings" && (
            <SettingsPanel
              key={dashboard.workspace.updatedAt}
              workspace={dashboard.workspace}
              onUpdate={updateWorkspace}
            />
          )}

          <div className="bottom-note">
            <span className="bottom-note-icon"><ShieldCheck aria-hidden="true" /></span>
            <span><strong>Grounded in your sources.</strong> The assistant cites documents from this workspace and does not invent missing policies.</span>
            <span className="bottom-note-link"><Check aria-hidden="true" /> Privacy first</span>
          </div>
          <footer className="page-footer">
            <span>© 2026 ChatMosaic</span>
            <span>Knowledge tools for community organizations</span>
            <a href="/api/export"><ArrowDownToLine aria-hidden="true" /> Export data</a>
          </footer>
        </div>
      </section>
    </main>
  );
}
