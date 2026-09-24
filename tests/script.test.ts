// tests/script.test.ts
import { describe, it, expect } from "vitest";
import { SceneSchema, ScriptSchema, toMarkdown } from "../src/lib/scriptSchema";
describe("SceneSchema", () => {
  it("rejects missing camera movement", () => {
    const r = SceneSchema.safeParse({ slug: "INT. KITCHEN - DAY", durationSec: 6, setting: "x", backgroundTheme: "x", lighting: "x", beats: ["a"], camera: { shotSize: "WS", angle: "eye", lens: "35mm" }, dialogue: [], sound: { sfx: [], music: "" }, transition: "cut", aiPrompt: "x", negativePrompt: "x" });
    expect(r.success).toBe(false);
  });
  it("accepts a minimal valid scene", () => {
    const r = SceneSchema.safeParse({ slug: "INT. KITCHEN - DAY", durationSec: 6, setting: "x", backgroundTheme: "x", lighting: "x", beats: ["a"], camera: { shotSize: "WS", angle: "eye", movement: "static", lens: "35mm" }, dialogue: [], sound: { sfx: [], music: "" }, transition: "cut", aiPrompt: "x", negativePrompt: "x" });
    expect(r.success).toBe(true);
  });
  it("ScriptSchema requires at least one scene", () => {
    expect(ScriptSchema.safeParse({ consistencyBlock: "bible", scenes: [] }).success).toBe(false);
  });
  it("toMarkdown output contains dialogue line", () => {
    const md = toMarkdown({ consistencyBlock: "bible", scenes: [{ slug: "INT. KITCHEN - DAY", durationSec: 6, setting: "x", backgroundTheme: "x", lighting: "x", beats: ["a"], camera: { shotSize: "WS", angle: "eye", movement: "static", lens: "35mm" }, dialogue: ["Kola: No wahala."], sound: { sfx: [], music: "" }, transition: "cut", aiPrompt: "x", negativePrompt: "x" }] });
    expect(md).toContain("Kola: No wahala.");
  });
});
