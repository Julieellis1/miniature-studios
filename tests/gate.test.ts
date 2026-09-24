// tests/gate.test.ts
import { describe, it, expect } from "vitest";
import { isAuthed } from "../src/lib/auth";
describe("gate", () => { it("rejects empty cookie", () => { expect(isAuthed("", "secret")).toBe(false); }); });
