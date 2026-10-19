import { jwtVerify } from "jose";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Optimistic route protection: bounce signed-out visitors before rendering.
 * Pages and Server Actions still re-check the session against the database.
 */
const SESSION_COOKIE = "nm_session";

async function readSession(token: string | undefined): Promise<{ isAdmin: boolean } | null> {
  const secret = process.env.SESSION_SECRET;
  if (!token || !secret) return null;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), { algorithms: ["HS256"] });
    return { isAdmin: payload.isAdmin === true };
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const session = await readSession(request.cookies.get(SESSION_COOKIE)?.value);

  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") {
      return session?.isAdmin ? NextResponse.redirect(new URL("/admin", request.url)) : NextResponse.next();
    }
    if (!session?.isAdmin) return NextResponse.redirect(new URL("/admin/login", request.url));
    return NextResponse.next();
  }

  if (pathname.startsWith("/account") && !session) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname + search);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/account/:path*"],
};
