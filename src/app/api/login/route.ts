import { NextResponse } from "next/server";
import { AUTH_COOKIE } from "@/lib/auth";

export async function POST(req: Request) {
  const want = process.env.APP_PASSWORD ?? "";
  if (!want) return NextResponse.json({ error: "APP_PASSWORD not set" }, { status: 500 });
  const { password } = await req.json().catch(() => ({ password: "" }));
  if (password !== want) return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, want, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
