// tests/import.test.ts
import { describe, it, expect } from "vitest";
import { validateImportRow, MAX_IMAGE_CHARS } from "../src/lib/import";

describe("validateImportRow", () => {
  it("rejects empty name", () => {
    const r = validateImportRow({ name: "  " }, 0);
    expect(r.ok).toBe(false);
  });
  it("rejects oversize image instead of truncating", () => {
    const r = validateImportRow({ name: "Kola", imageUrl: "x".repeat(MAX_IMAGE_CHARS + 1) }, 1);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.reason).toContain("too large");
  });
  it("accepts a valid row with legacy keys", () => {
    const r = validateImportRow({ name: "Small", details: "yellow shirt", image: "" }, 2);
    expect(r).toEqual({
      ok: true,
      body: { name: "Small", role: "", height: "", color: "", bibleDetails: "yellow shirt", imageUrl: "" },
    });
  });
});
