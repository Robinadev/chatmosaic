import { createNeonAuth } from "@neondatabase/auth/next/server";

const baseUrl = process.env.NEON_AUTH_BASE_URL;
const cookieSecret = process.env.NEON_AUTH_COOKIE_SECRET;

if (!baseUrl || !cookieSecret) {
  throw new Error("Managed Neon Auth requires NEON_AUTH_BASE_URL and NEON_AUTH_COOKIE_SECRET.");
}

export const auth = createNeonAuth({
  baseUrl,
  cookies: {
    secret: cookieSecret,
    sessionDataTtl: 300,
    sameSite: process.env.NODE_ENV === "development" ? "none" : "lax",
  },
});
