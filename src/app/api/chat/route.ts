import { NextResponse } from "next/server";
import { getAssistant, getDocuments } from "@/lib/store";

export const runtime = "nodejs";
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" };
export async function OPTIONS() { return new Response(null, { status: 204, headers: cors }); }
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const message = typeof body.message === "string" ? body.message.trim().slice(0, 2000) : "";
    if (!message) return NextResponse.json({ error: "Enter a question." }, { status: 400, headers: cors });
    const assistant = await getAssistant();
    if (body.assistantId && body.assistantId !== assistant.id) return NextResponse.json({ error: "Assistant not found." }, { status: 404, headers: cors });
    const documents = await getDocuments();
    if (!documents.length) return NextResponse.json({ answer: "I’m not able to answer that yet because this organization hasn’t added any information to its knowledge base.", sources: [] }, { headers: cors });
    const terms = message.toLowerCase().split(/[^a-z0-9]+/).filter((term: string) => term.length > 2);
    const ranked = documents.map((document) => ({ document, score: terms.reduce((score: number, term: string) => score + ((document.name + " " + document.text).toLowerCase().split(term).length - 1), 0) })).sort((a, b) => b.score - a.score).slice(0, 3);
    const context = ranked.filter((item) => item.score > 0).map(({ document }) => `SOURCE: ${document.name}\n${document.text.slice(0, 9000)}`).join("\n\n");
    if (process.env.ANTHROPIC_API_KEY && context) {
      const { default: Anthropic } = await import("@anthropic-ai/sdk");
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const response = await client.messages.create({ model: process.env.ANTHROPIC_MODEL || "claude-3-5-haiku-latest", max_tokens: 500, system: `You are the helpful, careful community assistant for ${assistant.organizationName}. Answer only using the provided organization sources. If the sources do not contain the answer, say so and suggest contacting the organization. Never invent services, contact details, or emergency advice. Keep answers concise. Cite source filenames when useful.\n\n${context}`, messages: [{ role: "user", content: message }] });
      const answer = response.content.filter((part) => part.type === "text").map((part) => part.text).join("\n");
      return NextResponse.json({ answer, sources: ranked.filter((item) => item.score > 0).map(({ document }) => document.name) }, { headers: cors });
    }
    const matches = ranked.filter((item) => item.score > 0);
    const answer = matches.length ? `I found relevant information in ${matches.map(({ document }) => document.name).join(", ")}. ${matches.map(({ document }) => document.text.slice(0, 700).trim()).join("\n\n")}` : "I couldn’t find that in the organization’s uploaded resources. Please contact the organization directly for help.";
    return NextResponse.json({ answer, sources: matches.map(({ document }) => document.name) }, { headers: cors });
  } catch { return NextResponse.json({ error: "Chat is temporarily unavailable." }, { status: 500, headers: cors }); }
}
