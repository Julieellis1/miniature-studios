// src/lib/models.ts
export function normalizeBaseUrl(u: string) { return u.trim().replace(/\/+$/, ""); }
export function chatEndpoint(baseUrl: string) {
  const b = normalizeBaseUrl(baseUrl);
  return /\/chat\/completions$/.test(b) ? b : b + "/chat/completions";
}
