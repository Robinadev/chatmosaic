import { NextResponse } from "next/server";
import { z } from "zod";
import { generateGroundedAnswer } from "@/lib/assistant/generate-answer";
import { retrieveRelevantChunks } from "@/lib/assistant/retrieve";
import { hasSameOrigin } from "@/lib/security/request-origin";
import { getPublicWorkspaceBySlug } from "@/lib/workspaces";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export const runtime = "nodejs";
export const maxDuration = 60;

const messageSchema = z.object({ message: z.string().trim().min(1).max(2_000) }).strict();

export async function POST(request: Request, { params }: RouteContext) {
  if (!hasSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const { slug } = await params;
  if (!/^[a-zA-Z0-9-]{8,64}$/.test(slug)) {
    return NextResponse.json({ error: "Assistant not found." }, { status: 404 });
  }

  const workspace = await getPublicWorkspaceBySlug(slug);
  if (!workspace) {
    return NextResponse.json({ error: "Assistant not found." }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "A valid JSON request is required." }, { status: 400 });
  }

  const parsed = messageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a message of 1–2,000 characters." }, { status: 400 });
  }

  const evidence = await retrieveRelevantChunks(workspace.userId, workspace.id, parsed.data.message);
  if (!evidence.length) {
    return NextResponse.json({
      answer: "I couldn’t find an answer to that in the organization’s published sources. Please contact them directly for help.",
      sources: [],
    });
  }

  try {
    const result = await generateGroundedAnswer(workspace.name, parsed.data.message, evidence);
    return NextResponse.json(
      { answer: result.text, sources: result.sources },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[public-chat] Answer generation failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "The assistant could not finish that response. Please try again." },
      { status: 503 },
    );
  }
}
