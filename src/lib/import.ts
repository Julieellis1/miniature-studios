// src/lib/import.ts — validation for legacy IndexedDB export import.
export const MAX_IMAGE_CHARS = 2000000;

export type ImportRowError = { index: number; name: string; reason: string };

export function validateImportRow(
  c: any,
  index: number
): { ok: true; body: { name: string; role: string; height: string; color: string; bibleDetails: string; imageUrl: string } } | { ok: false; error: ImportRowError } {
  const rawName = typeof c?.name === "string" ? c.name.trim() : "";
  if (!rawName)
    return { ok: false, error: { index, name: `#${index + 1}`, reason: "name required" } };
  const imageUrl = c.imageUrl ?? c.image ?? "";
  const img = typeof imageUrl === "string" ? imageUrl : "";
  if (img.length > MAX_IMAGE_CHARS)
    return {
      ok: false,
      error: {
        index,
        name: rawName,
        reason: `image too large (${img.length} chars, max ${MAX_IMAGE_CHARS})`,
      },
    };
  return {
    ok: true,
    body: {
      name: rawName,
      role: c.role ?? "",
      height: c.height ?? "",
      color: c.color ?? "",
      bibleDetails: c.bibleDetails ?? c.details ?? "",
      imageUrl: img,
    },
  };
}
