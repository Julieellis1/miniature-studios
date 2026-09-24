// tests/chat.test.ts
import { describe, it, expect } from "vitest";
import { buildProviderBody } from "../src/lib/chat";
describe("buildProviderBody", () => {
  it("passes model and messages", () => {
    expect(buildProviderBody("gpt-4o-mini", [{ role: "user", content: "hi" }])).toEqual({ model: "gpt-4o-mini", messages: [{ role: "user", content: "hi" }], temperature: 0.8 });
  });
});
