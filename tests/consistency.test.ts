// tests/consistency.test.ts
import { describe, it, expect } from "vitest";
import { buildConsistencyBlock } from "../src/lib/chat";
describe("consistency", () => {
  it("joins bible lines", () => {
    expect(buildConsistencyBlock([{ name: "Small", role: "Scout", bibleDetails: "yellow shirt" }])).toContain("Small (Scout): yellow shirt");
  });
  it("joins multiple characters with newlines", () => {
    const out = buildConsistencyBlock([
      { name: "Baba Six", role: "Leader / fixer", bibleDetails: "cream shirt" },
      { name: "Kola", role: "Hustler / delivery guy", bibleDetails: "orange vest" },
    ]);
    expect(out).toBe("- Baba Six (Leader / fixer): cream shirt\n- Kola (Hustler / delivery guy): orange vest");
  });
  it("returns empty string for no characters", () => {
    expect(buildConsistencyBlock([])).toBe("");
  });
});
