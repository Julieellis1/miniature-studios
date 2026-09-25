// src/app/api/chat/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { chatEndpoint } from "@/lib/models";
import { buildProviderBody } from "@/lib/chat";

// Long generations (full pro scripts) can take minutes. Vercel Hobby caps
// functions below this; `maxDuration` applies where the plan allows it.
export const maxDuration = 300;
const TIMEOUT_MS = Number(process.env.CHAT_TIMEOUT_MS) || 300000;
const TIMEOUT_S = Math.round(TIMEOUT_MS / 1000);
export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const { modelId, messages, maxTokens } = body ?? {};
  const m = await db.model.findUnique({ where: { id: Number(modelId) } });
  if (!m) return NextResponse.json({ error: "Select or add a model in Models first." }, { status: 400 });
  if (!Array.isArray(messages) || !messages.length)
    return NextResponse.json({ error: "messages must be a non-empty array." }, { status: 400 });
  let endpoint: string;
  try {
    const u = new URL(chatEndpoint(m.baseUrl));
    if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error("bad protocol");
    endpoint = u.toString();
  } catch {
    return NextResponse.json(
      { error: `Model base URL is invalid: "${m.baseUrl}". Check it in Models and use Test.` },
      { status: 400 }
    );
  }
  let r: Response;
  try {
    r = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json", ...(m.apiKey ? { Authorization: "Bearer " + m.apiKey } : {}) }, body: JSON.stringify(buildProviderBody(m.model, messages, maxTokens)), signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (e: any) {
    const timedOut = e?.name === "TimeoutError" || e?.name === "AbortError";
    return NextResponse.json(
      {
        error: timedOut
          ? `Provider timed out after ${TIMEOUT_S}s. Try fewer scenes/shorter output, or Test the model in Models.`
          : `Could not reach provider: ${e?.message ?? e}. Check base URL in Models and use Test.`,
      },
      { status: 502 }
    );
  }
  const text = await r.text();
  if (!r.ok) return NextResponse.json({ error: text.slice(0, 2000) }, { status: 502 });
  let j: any;
  try {
    j = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: text.slice(0, 2000) }, { status: 502 });
  }
  return NextResponse.json({ text: j.choices?.[0]?.message?.content ?? "No response returned." });
}
