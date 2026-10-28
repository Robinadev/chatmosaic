"use client";

import { useState, useSyncExternalStore, type FormEvent } from "react";
import { Copy, Download, ExternalLink, Globe2, LockKeyhole, Save } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldLegend,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { WorkspaceSummary } from "@/lib/types";

export type WorkspaceUpdate = Partial<
  Pick<WorkspaceSummary, "name" | "assistantName" | "welcomeMessage" | "accentColor" | "isPublic">
>;

type SettingsPanelProps = {
  workspace: WorkspaceSummary;
  onUpdate: (changes: WorkspaceUpdate) => Promise<WorkspaceSummary>;
};

type SettingsDraft = {
  name: string;
  assistantName: string;
  welcomeMessage: string;
  accentColor: string;
  isPublic: boolean;
};

function getDraft(workspace: WorkspaceSummary): SettingsDraft {
  return {
    name: workspace.name,
    assistantName: workspace.assistantName,
    welcomeMessage: workspace.welcomeMessage,
    accentColor: workspace.accentColor,
    isPublic: workspace.isPublic,
  };
}

function escapeAttribute(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/\"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function subscribeToLocation() {
  return () => undefined;
}

function getBrowserOrigin() {
  return window.location.origin;
}

function getServerOrigin() {
  return "";
}

export function SettingsPanel({ workspace, onUpdate }: SettingsPanelProps) {
  const [draft, setDraft] = useState(() => getDraft(workspace));
  const [saving, setSaving] = useState(false);
  const origin = useSyncExternalStore(subscribeToLocation, getBrowserOrigin, getServerOrigin);
  const sharePath = `/assistant/${workspace.shareSlug}`;
  const shareUrl = origin ? `${origin}${sharePath}` : sharePath;
  const embedCode = `<iframe src="${shareUrl}" title="${escapeAttribute(workspace.assistantName)}" width="100%" height="680" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" style="border:0;border-radius:16px"></iframe>`;
  const dirty =
    draft.name !== workspace.name ||
    draft.assistantName !== workspace.assistantName ||
    draft.welcomeMessage !== workspace.welcomeMessage ||
    draft.accentColor !== workspace.accentColor ||
    draft.isPublic !== workspace.isPublic;


  function updateDraft<K extends keyof SettingsDraft>(key: K, value: SettingsDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    if (draft.isPublic && !workspace.isPublic) {
      const confirmed = window.confirm(
        "Anyone with the assistant link will be able to ask questions using the sources you publish. Continue?",
      );
      if (!confirmed) return;
    }

    setSaving(true);
    try {
      const updated = await onUpdate(draft);
      setDraft(getDraft(updated));
      toast.success("Workspace settings saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Settings could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function copyValue(value: string, successMessage: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(successMessage);
    } catch {
      toast.error("Clipboard access is unavailable in this browser.");
    }
  }

  async function publishAssistant() {
    if (!workspace.isPublic) {
      const confirmed = window.confirm(
        "Anyone with the assistant link will be able to ask questions using the sources you publish. Continue?",
      );
      if (!confirmed) return;
      try {
        const updated = await onUpdate({ isPublic: true });
        setDraft(getDraft(updated));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "The assistant could not be published.");
        return;
      }
    }
    await copyValue(origin ? `${origin}${sharePath}` : sharePath, "Assistant link copied.");
  }

  return (
    <div className="settings-grid">
      <Card className="panel settings-card">
        <CardHeader className="settings-card-header">
          <CardTitle>Workspace settings</CardTitle>
          <CardDescription>Personalize the assistant and control how it is shared.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldSet className="settings-fieldset">
              <FieldLegend variant="label">Organization and assistant</FieldLegend>
              <FieldGroup className="settings-fields">
                <Field>
                  <FieldLabel htmlFor="workspace-name">Organization name</FieldLabel>
                  <Input
                    id="workspace-name"
                    value={draft.name}
                    onChange={(event) => updateDraft("name", event.target.value)}
                    maxLength={100}
                    minLength={2}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="assistant-name">Assistant name</FieldLabel>
                  <Input
                    id="assistant-name"
                    value={draft.assistantName}
                    onChange={(event) => updateDraft("assistantName", event.target.value)}
                    maxLength={60}
                    minLength={2}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="welcome-message">Welcome message</FieldLabel>
                  <Textarea
                    id="welcome-message"
                    value={draft.welcomeMessage}
                    onChange={(event) => updateDraft("welcomeMessage", event.target.value)}
                    maxLength={400}
                    minLength={5}
                    rows={3}
                    required
                  />
                  <FieldDescription>This appears before a visitor asks their first question.</FieldDescription>
                </Field>
                <Field>
                  <FieldLabel htmlFor="accent-color">Accent color</FieldLabel>
                  <Input
                    id="accent-color"
                    type="color"
                    value={draft.accentColor}
                    onChange={(event) => updateDraft("accentColor", event.target.value)}
                    className="color-input"
                  />
                </Field>
                <Field orientation="horizontal" className="public-toggle-field">
                  <input
                    id="assistant-public"
                    type="checkbox"
                    checked={draft.isPublic}
                    onChange={(event) => updateDraft("isPublic", event.target.checked)}
                    className="size-4 accent-primary"
                  />
                  <FieldContent>
                    <FieldLabel htmlFor="assistant-public">Publish a shareable assistant</FieldLabel>
                    <FieldDescription>
                      {draft.isPublic
                        ? "Anyone with the link can ask questions. Visitor conversations are not saved."
                        : "Private until you choose to publish it."}
                    </FieldDescription>
                  </FieldContent>
                </Field>
              </FieldGroup>
            </FieldSet>
            <div className="settings-actions">
              <Button type="submit" disabled={!dirty || saving}>
                <Save data-icon="inline-start" /> {saving ? "Saving…" : "Save settings"}
              </Button>
              <Button asChild variant="outline">
                <a href="/api/export">
                  <Download data-icon="inline-start" /> Export workspace data
                </a>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="panel share-settings-card">
        <CardHeader className="settings-card-header">
          <CardTitle>Sharing</CardTitle>
          <CardDescription>Publish the assistant only when its sources are ready for visitors.</CardDescription>
        </CardHeader>
        <CardContent className="share-settings-content">
          <div className="share-state-row">
            {workspace.isPublic ? (
              <Badge variant="secondary"><Globe2 aria-hidden="true" /> Public link enabled</Badge>
            ) : (
              <Badge variant="outline"><LockKeyhole aria-hidden="true" /> Private</Badge>
            )}
            <Button type="button" size="sm" variant="outline" onClick={() => void publishAssistant()}>
              {workspace.isPublic ? <Copy data-icon="inline-start" /> : <Globe2 data-icon="inline-start" />}
              {workspace.isPublic ? "Copy link" : "Publish assistant"}
            </Button>
          </div>
          {workspace.isPublic ? (
            <>
              <Field>
                <FieldLabel htmlFor="share-url">Assistant link</FieldLabel>
                <Input id="share-url" readOnly value={shareUrl} />
              </Field>
              <Field>
                <FieldLabel htmlFor="embed-code">Embed code</FieldLabel>
                <Textarea id="embed-code" readOnly rows={4} value={embedCode} />
              </Field>
              <Button type="button" variant="outline" onClick={() => void copyValue(embedCode, "Embed code copied.")}>
                <Copy data-icon="inline-start" /> Copy embed code
              </Button>
              <Button asChild variant="link" className="open-assistant-link">
                <a href={sharePath} target="_blank" rel="noreferrer">
                  Open public assistant <ExternalLink data-icon="inline-end" />
                </a>
              </Button>
            </>
          ) : (
            <p className="share-private-note">
              Your sources and assistant stay private. Publishing creates a public chat page; it never exposes the private file downloads.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
