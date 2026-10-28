import { NextResponse } from "next/server";
import { getAssistant, getDocuments, saveAssistant } from "@/lib/store";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ assistant: await getAssistant(), documents: await getDocuments() });
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const current = await getAssistant();
    const assistant = await saveAssistant({
      ...current,
      organizationName: String(body.organizationName ?? current.organizationName).trim().slice(0, 100),
      welcomeMessage: String(body.welcomeMessage ?? current.welcomeMessage).trim().slice(0, 500),
      primaryColor: /^#[0-9a-fA-F]{6}$/.test(body.primaryColor) ? body.primaryColor : current.primaryColor,
      websiteUrl: String(body.websiteUrl ?? "").slice(0, 300),
      public: body.public !== false,
    });
    return NextResponse.json({ assistant });
  } catch {
    return NextResponse.json({ error: "Invalid assistant settings." }, { status: 400 });
  }
}
