import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isAuthed } from "./lib/auth";

const STATIC_FILES = [
  "/favicon.ico",
  "/manifest.webmanifest",
  "/icon-192.png",
  "/icon-512.png",
  "/icon.svg",
];

function isPublicPath(p: string) {
  if (p === "/login" || p.startsWith("/login/")) return true;
  if (p === "/api/login" || p.startsWith("/api/login/")) return true;
  if (p === "/api/health" || p.startsWith("/api/health/")) return true;
  if (p === "/_next" || p.startsWith("/_next/")) return true;
  return STATIC_FILES.includes(p);
}

export function middleware(req: NextRequest) {
  const p = req.nextUrl.pathname;
  if (isPublicPath(p)) return NextResponse.next();
  const want = process.env.APP_PASSWORD ?? "";
  if (!want) {
    // Fail-closed: server misconfigured, allow only public paths above.
    if (p.startsWith("/api/"))
      return NextResponse.json({ error: "APP_PASSWORD not set" }, { status: 500 });
    return new NextResponse("APP_PASSWORD not set", { status: 500 });
  }
  const cookie = req.headers.get("cookie") ?? "";
  if (isAuthed(cookie, want)) return NextResponse.next();
  if (p.startsWith("/api/"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.redirect(new URL("/login", req.url));
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icon-192.png|icon-512.png|icon.svg).*)",
  ],
};
