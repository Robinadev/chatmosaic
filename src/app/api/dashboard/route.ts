import { NextResponse } from "next/server";
import { getDashboardPayload } from "@/lib/dashboard";
import { getSessionUser } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const dashboard = await getDashboardPayload(user.id);
  return NextResponse.json(dashboard, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
