import { cookies } from "next/headers";
import { isAllowedEmail } from "./email";
import { SignJWT, jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.REVIEW_AUTH_SECRET || "scalpel-review-secret-change-me",
);

const COOKIE_NAME = "scalpel-review-session";
const CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const SESSION_TTL = "24h";

// In-memory code store (OK for single-user MVP)
const codeStore = new Map<string, { code: string; expires: number }>();

export function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function storeCode(email: string, code: string): void {
  codeStore.set(email.toLowerCase(), {
    code,
    expires: Date.now() + CODE_TTL_MS,
  });
}

export function verifyCode(email: string, code: string): boolean {
  const stored = codeStore.get(email.toLowerCase());
  if (!stored) return false;
  if (Date.now() > stored.expires) {
    codeStore.delete(email.toLowerCase());
    return false;
  }
  if (stored.code !== code) return false;
  codeStore.delete(email.toLowerCase());
  return true;
}

export async function createSession(email: string): Promise<string> {
  const token = await new SignJWT({ email: email.toLowerCase() })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(SESSION_TTL)
    .sign(SECRET);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24 hours
    path: "/",
  });

  return token;
}

export async function getSession(): Promise<{ email: string } | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(token, SECRET);
    const email = payload.email as string;
    if (!isAllowedEmail(email)) return null;

    return { email };
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
