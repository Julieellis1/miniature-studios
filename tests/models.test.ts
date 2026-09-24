// tests/models.test.ts
import { describe, it, expect } from "vitest";
import { normalizeBaseUrl, chatEndpoint } from "../src/lib/models";
describe("normalizeBaseUrl", () => {
  it("trims trailing slash", () => {
    expect(normalizeBaseUrl("https://api.openai.com/v1/")).toBe("https://api.openai.com/v1");
  });
  it("trims multiple trailing slashes and whitespace", () => {
    expect(normalizeBaseUrl("  https://api.openai.com/v1///  ")).toBe("https://api.openai.com/v1");
  });
});
describe("chatEndpoint", () => {
  it("appends /chat/completions unless present", () => {
    expect(chatEndpoint("https://api.openai.com/v1/")).toBe("https://api.openai.com/v1/chat/completions");
    expect(chatEndpoint("https://api.openai.com/v1/chat/completions")).toBe("https://api.openai.com/v1/chat/completions");
  });
});
