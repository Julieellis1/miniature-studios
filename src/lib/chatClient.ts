// src/lib/chatClient.ts — browser-side helper: always resolves or throws, never hangs.
export async function chatOnce(
  modelId: number,
  messages: { role: string; content: string }[],
  opts: { timeoutMs?: number; maxTokens?: number } = {}
): Promise<string> {
  const timeoutMs = opts.timeoutMs ?? 90000;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ modelId, messages, ...(opts.maxTokens ? { maxTokens: opts.maxTokens } : {}) }),
      signal: ctrl.signal,
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || j.error) throw new Error(j.error ?? `Request failed (${r.status})`);
    if (typeof j.text !== "string" || !j.text) throw new Error("Empty response from model.");
    return j.text;
  } catch (e: any) {
    if (e?.name === "AbortError")
      throw new Error(`Timed out after ${Math.round(timeoutMs / 1000)}s. Test the model in Models.`);
    throw e instanceof Error ? e : new Error(String(e));
  } finally {
    clearTimeout(timer);
  }
}
