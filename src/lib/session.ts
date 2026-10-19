import "server-only";
import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { connection } from "next/server";

const COOKIE = "nm_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export type SessionPayload = { userId: number; isAdmin: boolean };

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) {
    throw new Error("SESSION_SECRET must be set in .env.local (at least 32 characters).");
  }
  return new TextEncoder().encode(value);
}

export async function encrypt(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
}

export async function decrypt(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify<SessionPayload>(token, secret(), { algorithms: ["HS256"] });
    return { userId: payload.userId, isAdmin: payload.isAdmin };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  await connection(); // token expiry is checked against the current time
  return decrypt(token);
}

export async function createSession(payload: SessionPayload): Promise<void> {
  (await cookies()).set(COOKIE, await encrypt(payload), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function deleteSession(): Promise<void> {
  (await cookies()).delete(COOKIE);
}

export const SESSION_COOKIE = COOKIE;
