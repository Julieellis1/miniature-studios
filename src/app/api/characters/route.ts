// src/app/api/characters/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
export const MAX_IMAGE_CHARS = 2000000;
function tooLarge(imageUrl: unknown) { return typeof imageUrl === "string" && imageUrl.length > MAX_IMAGE_CHARS; }
async function readBody(req: Request): Promise<{ data: any } | { error: string; status: number }> {
  const ct = req.headers.get("content-type") ?? "";
  if (ct.includes("multipart/form-data")) {
    const fd = await req.formData();
    const str = (k: string) => { const v = fd.get(k); return typeof v === "string" ? v : undefined; };
    const file = fd.get("image");
    let imageUrl = str("imageUrl");
    if (file instanceof File && file.size > 0) {
      if (file.size > MAX_IMAGE_CHARS) return { error: "Image too large, max ~2MB", status: 413 };
      const buf = Buffer.from(await file.arrayBuffer());
      imageUrl = `data:${file.type || "image/jpeg"};base64,${buf.toString("base64")}`;
      if (imageUrl.length > MAX_IMAGE_CHARS) return { error: "Image too large, max ~2MB", status: 413 };
    }
    return { data: { name: str("name"), role: str("role"), height: str("height"), color: str("color"), bibleDetails: str("bibleDetails"), imageUrl } };
  }
  return { data: await req.json() };
}
export async function GET() { return NextResponse.json(await db.character.findMany({ orderBy: { id: "asc" } })); }
export async function POST(req: Request) {
  const parsed = await readBody(req);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: parsed.status });
  const b = parsed.data;
  if (typeof b.name !== "string" || !b.name.trim()) return NextResponse.json({ error: "name required" }, { status: 400 });
  if (tooLarge(b.imageUrl)) return NextResponse.json({ error: "Image too large, max ~2MB" }, { status: 413 });
  return NextResponse.json(await db.character.create({ data: { name: b.name, role: b.role ?? "", height: b.height ?? "", color: b.color ?? "", bibleDetails: b.bibleDetails ?? "", imageUrl: b.imageUrl ?? "" } }), { status: 201 });
}
export async function PUT(req: Request) {
  const parsed = await readBody(req);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: parsed.status });
  const b = parsed.data;
  const id = Number(b.id);
  if (!Number.isInteger(id)) return NextResponse.json({ error: "id required" }, { status: 400 });
  if (b.name !== undefined && (typeof b.name !== "string" || !b.name.trim())) return NextResponse.json({ error: "name required" }, { status: 400 });
  if (tooLarge(b.imageUrl)) return NextResponse.json({ error: "Image too large, max ~2MB" }, { status: 413 });
  const data: any = {};
  for (const k of ["name", "role", "height", "color", "bibleDetails", "imageUrl"]) if (b[k] !== undefined) data[k] = b[k];
  try {
    return NextResponse.json(await db.character.update({ where: { id }, data }));
  } catch {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
}
export async function DELETE(req: Request) {
  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!Number.isInteger(id)) return NextResponse.json({ error: "id required" }, { status: 400 });
  try {
    await db.character.delete({ where: { id } });
  } catch {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
