// src/app/api/models/select/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
const publicSelect = { id: true, label: true, provider: true, baseUrl: true, model: true, isSelected: true, createdAt: true };
export async function PATCH(req: Request) {
  const { id } = await req.json();
  if (!Number.isInteger(Number(id))) return NextResponse.json({ error: "id required" }, { status: 400 });
  const target = await db.model.findUnique({ where: { id: Number(id) } });
  if (!target) return NextResponse.json({ error: "not found" }, { status: 404 });
  await db.model.updateMany({ data: { isSelected: false } });
  const row = await db.model.update({ where: { id: Number(id) }, data: { isSelected: true }, select: publicSelect });
  return NextResponse.json(row);
}
