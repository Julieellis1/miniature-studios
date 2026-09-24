// src/app/api/stories/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
export async function GET() { return NextResponse.json(await db.story.findMany({ orderBy: { updatedAt: "desc" } })); }
export async function POST(req: Request) {
  const b = await req.json();
  return NextResponse.json(await db.story.create({ data: { title: b.title ?? "Untitled story", idea: b.idea ?? "", goal: b.goal ?? "", chat: b.chat ?? [], premise: b.premise ?? "", scenes: b.scenes ?? [], scriptMarkdown: b.scriptMarkdown ?? "", videoPrompts: b.videoPrompts ?? [], checklist: b.checklist ?? [] } }), { status: 201 });
}
export async function PUT(req: Request) {
  const b = await req.json();
  const id = Number(b.id);
  if (!Number.isInteger(id)) return NextResponse.json({ error: "id required" }, { status: 400 });
  const data: any = {};
  for (const k of ["title", "idea", "goal", "chat", "premise", "scenes", "scriptMarkdown", "videoPrompts", "checklist"]) if (b[k] !== undefined) data[k] = b[k];
  try {
    return NextResponse.json(await db.story.update({ where: { id }, data }));
  } catch {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
}
export async function DELETE(req: Request) {
  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!Number.isInteger(id)) return NextResponse.json({ error: "id required" }, { status: 400 });
  try {
    await db.story.delete({ where: { id } });
  } catch {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
