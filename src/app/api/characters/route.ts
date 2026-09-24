// src/app/api/characters/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  buildStorageValue,
  deleteCharacterImage,
  getCharacterImageUrl,
  isBucketKey,
  parseBucketKey,
  putCharacterImage,
  storageConfigured,
} from "@/lib/storage";

const MAX_IMAGE_CHARS = 2000000;

function tooLarge(imageUrl: unknown) {
  return typeof imageUrl === "string" && imageUrl.length > MAX_IMAGE_CHARS;
}

function extFor(contentType: string): { ext: string; contentType: string } {
  const ct = (contentType || "").toLowerCase().split(";")[0].trim();
  if (ct === "image/png") return { ext: "png", contentType: "image/png" };
  if (ct === "image/webp") return { ext: "webp", contentType: "image/webp" };
  return { ext: "jpg", contentType: "image/jpeg" };
}

async function uploadFileToBucket(tag: string | number, file: File): Promise<string> {
  if (!storageConfigured) {
    throw Object.assign(new Error("Neon storage not configured"), { status: 503 });
  }
  const { ext, contentType } = extFor(file.type);
  const key = `${tag}-${Date.now()}.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  await putCharacterImage(key, bytes, contentType);
  return buildStorageValue(key);
}

async function readBody(req: Request): Promise<{ data: any } | { error: string; status: number }> {
  const ct = req.headers.get("content-type") ?? "";
  if (ct.includes("multipart/form-data")) {
    const fd = await req.formData();
    const str = (k: string) => {
      const v = fd.get(k);
      return typeof v === "string" ? v : undefined;
    };
    const file = fd.get("image");
    let imageUrl = str("imageUrl");
    if (file instanceof File && file.size > 0) {
      if (file.size > MAX_IMAGE_CHARS) return { error: "Image too large, max ~2MB", status: 413 };
      try {
        const idHint = str("id") ?? "new";
        imageUrl = await uploadFileToBucket(idHint, file);
      } catch (e: any) {
        const status = typeof e?.status === "number" ? e.status : 503;
        return { error: e?.message || "Storage upload failed", status };
      }
    }
    return {
      data: {
        id: str("id"),
        name: str("name"),
        role: str("role"),
        height: str("height"),
        color: str("color"),
        bibleDetails: str("bibleDetails"),
        imageUrl,
      },
    };
  }
  return { data: await req.json() };
}

async function withSignedUrls(rows: any[]): Promise<any[]> {
  return Promise.all(
    rows.map(async (row) => {
      if (!isBucketKey(row.imageUrl)) return row;
      const key = parseBucketKey(row.imageUrl);
      if (!key) return row;
      try {
        const url = await getCharacterImageUrl(key);
        return { ...row, imageUrl: url };
      } catch {
        return row;
      }
    })
  );
}

export async function GET() {
  const rows = await db.character.findMany({ orderBy: { id: "asc" } });
  return NextResponse.json(await withSignedUrls(rows));
}

export async function POST(req: Request) {
  const parsed = await readBody(req);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: parsed.status });
  const b = parsed.data;
  if (typeof b.name !== "string" || !b.name.trim())
    return NextResponse.json({ error: "name required" }, { status: 400 });
  if (tooLarge(b.imageUrl)) return NextResponse.json({ error: "Image too large, max ~2MB" }, { status: 413 });
  const created = await db.character.create({
    data: {
      name: b.name,
      role: b.role ?? "",
      height: b.height ?? "",
      color: b.color ?? "",
      bibleDetails: b.bibleDetails ?? "",
      imageUrl: b.imageUrl ?? "",
    },
  });
  const [mapped] = await withSignedUrls([created]);
  return NextResponse.json(mapped, { status: 201 });
}

export async function PUT(req: Request) {
  const parsed = await readBody(req);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: parsed.status });
  const b = parsed.data;
  const id = Number(b.id);
  if (!Number.isInteger(id)) return NextResponse.json({ error: "id required" }, { status: 400 });
  if (b.name !== undefined && (typeof b.name !== "string" || !b.name.trim()))
    return NextResponse.json({ error: "name required" }, { status: 400 });
  if (tooLarge(b.imageUrl)) return NextResponse.json({ error: "Image too large, max ~2MB" }, { status: 413 });
  const data: any = {};
  for (const k of ["name", "role", "height", "color", "bibleDetails", "imageUrl"])
    if (b[k] !== undefined) data[k] = b[k];
  // Best-effort cleanup of the previous bucket object when the image is replaced.
  let previous: string | null = null;
  if (data.imageUrl !== undefined) {
    try {
      const existing = await db.character.findUnique({ where: { id } });
      const prevKey =
        existing && isBucketKey(existing.imageUrl) ? parseBucketKey(existing.imageUrl as string) : null;
      const nextKey = isBucketKey(data.imageUrl) ? parseBucketKey(data.imageUrl as string) : null;
      if (prevKey && prevKey !== nextKey) previous = prevKey;
    } catch {
      previous = null;
    }
  }
  try {
    const updated = await db.character.update({ where: { id }, data });
    if (previous) {
      try {
        await deleteCharacterImage(previous);
      } catch {
        /* best-effort */
      }
    }
    const [mapped] = await withSignedUrls([updated]);
    return NextResponse.json(mapped);
  } catch {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
}

export async function DELETE(req: Request) {
  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!Number.isInteger(id)) return NextResponse.json({ error: "id required" }, { status: 400 });
  try {
    const existing = await db.character.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });
    await db.character.delete({ where: { id } });
    if (isBucketKey(existing.imageUrl)) {
      const key = parseBucketKey(existing.imageUrl as string);
      if (key) {
        try {
          await deleteCharacterImage(key);
        } catch {
          /* best-effort, ignore 404 */
        }
      }
    }
  } catch {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
