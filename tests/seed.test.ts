// tests/seed.test.ts
import { describe, it, expect } from "vitest";
import { seedCharacters } from "../prisma/seed-helpers";
describe("seed", () => {
  it("contains 5 bible characters", () => {
    const s = seedCharacters();
    expect(s.map((c) => c.name)).toEqual(["Baba Six", "Kola", "Amaka", "Uncle T", "Small"]);
  });
});
