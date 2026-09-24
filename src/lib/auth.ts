// src/lib/auth.ts — single-user cookie gate helpers.
export const AUTH_COOKIE = "ml-auth";

export function isAuthed(cookieHeader: string, want: string) {
  if (!want || want.length === 0) return false;
  if (!cookieHeader) return false;
  const parts = cookieHeader.split(";").map((s) => s.trim());
  return parts.includes(`${AUTH_COOKIE}=${want}`);
}
