// src/app/api/chat/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { chatEndpoint } from "@/lib/models";
import { buildProviderBody } from "@/lib/chat";
export async function POST(req: Request) {
  const { modelId, messages } = await req.json();
  const m = await db.model.findUnique({ where: { id: Number(modelId) } });
  if (!m) return NextResponse.json({ error: "Select or add a model in Models first." }, { status: 400 });
  const r = await fetch(chatEndpoint(m.baseUrl), { method: "POST", headers: { "Content-Type": "application/json", ...(m.apiKey ? { Authorization: "Bearer " + m.apiKey } : {}) }, body: JSON.stringify(buildProviderBody(m.model, messages)), signal: AbortSignal.timeout(60000) });
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
