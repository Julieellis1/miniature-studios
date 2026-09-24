// tests/chatClient.test.ts
import { describe, it, expect, vi, afterEach } from "vitest";
import { chatOnce } from "../src/lib/chatClient";
import { buildProviderBody } from "../src/lib/chat";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("buildProviderBody maxTokens", () => {
  it("includes max_tokens only when provided", () => {
    expect(buildProviderBody("m", [{ role: "user", content: "hi" }])).toEqual({
      model: "m",
      messages: [{ role: "user", content: "hi" }],
      temperature: 0.8,
    });
    expect(buildProviderBody("m", [{ role: "user", content: "hi" }], 16)).toEqual({
      model: "m",
      messages: [{ role: "user", content: "hi" }],
      temperature: 0.8,
      max_tokens: 16,
    });
  });
});

describe("chatOnce", () => {
  it("throws a timeout error instead of hanging when fetch never resolves", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn((_url: string, init?: any) => {
        return new Promise((_res, rej) => {
          init?.signal?.addEventListener("abort", () => {
            const e = new Error("aborted");
            e.name = "AbortError";
            rej(e);
          });
        });
      })
    );
    const p = chatOnce(1, [{ role: "user", content: "hi" }], { timeoutMs: 1000 });
    const assertion = expect(p).rejects.toThrow(/timed out after 1s/i);
    await vi.advanceTimersByTimeAsync(1000);
    await assertion;
  });

  it("throws server error text instead of hanging on non-JSON responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 500, json: async () => ({ error: "boom" }) }))
    );
    await expect(chatOnce(1, [{ role: "user", content: "hi" }])).rejects.toThrow("boom");
  });

  it("returns text on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ text: "OK" }) }))
    );
    await expect(chatOnce(1, [{ role: "user", content: "hi" }])).resolves.toBe("OK");
  });
});
