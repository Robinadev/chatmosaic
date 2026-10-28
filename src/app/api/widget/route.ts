import { NextResponse } from "next/server";
import { getAssistant } from "@/lib/store";

export const runtime = "nodejs";
export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  const assistant = await getAssistant();
  if (!assistant.public || (id && id !== assistant.id)) return NextResponse.json({ error: "Assistant not found." }, { status: 404, headers: { "Access-Control-Allow-Origin": "*" } });
  return NextResponse.json({ id: assistant.id, organizationName: assistant.organizationName, welcomeMessage: assistant.welcomeMessage, primaryColor: assistant.primaryColor }, { headers: { "Access-Control-Allow-Origin": "*", "Cache-Control": "public, max-age=60" } });
}
