import { createNeonAuth } from "@neondatabase/auth/next/server";

const baseUrl = process.env.NEON_AUTH_BASE_URL;
const cookieSecret = process.env.NEON_AUTH_COOKIE_SECRET?.trim();

if (!baseUrl) {
  throw new Error("Managed Neon Auth requires NEON_AUTH_BASE_URL.");
}

if (!cookieSecret || cookieSecret.length < 32) {
  throw new Error(
    "NEON_AUTH_COOKIE_SECRET must be at least 32 characters. Set a secure random value; `openssl rand -base64 32` is one option."
  );
}

export const auth = createNeonAuth({
  baseUrl,
  cookies: {
    secret: cookieSecret,
    sessionDataTtl: 300,
    sameSite: process.env.NODE_ENV === "development" ? "none" : "lax",
  },
});
