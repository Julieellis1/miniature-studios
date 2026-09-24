// src/app/api/models/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { normalizeBaseUrl } from "@/lib/models";
const publicSelect = { id: true, label: true, provider: true, baseUrl: true, model: true, isSelected: true, createdAt: true };
export async function GET() { return NextResponse.json(await db.model.findMany({ orderBy: { id: "asc" }, select: publicSelect })); }
export async function POST(req: Request) {
  const b = await req.json();
  if (typeof b.label !== "string" || !b.label.trim() || typeof b.model !== "string" || !b.model.trim() || typeof b.baseUrl !== "string" || !b.baseUrl.trim()) return NextResponse.json({ error: "label, model, baseUrl required" }, { status: 400 });
  const row = await db.model.create({ data: { label: b.label, provider: b.provider ?? "custom", baseUrl: normalizeBaseUrl(b.baseUrl), model: b.model, apiKey: b.apiKey ?? "" } });
  return NextResponse.json(row, { status: 201 });
}
export async function DELETE(req: Request) {
  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!Number.isInteger(id)) return NextResponse.json({ error: "id required" }, { status: 400 });
  try {
    await db.model.delete({ where: { id } });
  } catch {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
