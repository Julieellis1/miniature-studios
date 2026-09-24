// src/app/api/chat/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { chatEndpoint } from "@/lib/models";
import { buildProviderBody } from "@/lib/chat";
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
    r = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json", ...(m.apiKey ? { Authorization: "Bearer " + m.apiKey } : {}) }, body: JSON.stringify(buildProviderBody(m.model, messages, maxTokens)), signal: AbortSignal.timeout(60000) });
  } catch (e: any) {
    const timedOut = e?.name === "TimeoutError" || e?.name === "AbortError";
    return NextResponse.json(
      {
        error: timedOut
          ? "Provider timed out after 60s. Use Test in Models to check connectivity."
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
