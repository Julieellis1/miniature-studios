// tests/storage.test.ts — key-format tests (no env/credentials required).
import { describe, it, expect } from "vitest";
import { bucketName, isBucketKey, buildStorageValue, parseBucketKey, stripBucketPrefix } from "../src/lib/storage";

describe("storage key format", () => {
  it("bucket is the private characters bucket", () => {
    expect(bucketName).toBe("characters");
  });
  it("isBucketKey detects s3: references only", () => {
    expect(isBucketKey("s3:characters/1-123.jpg")).toBe(true);
    expect(isBucketKey("s3:other/1.jpg")).toBe(true);
    expect(isBucketKey("data:image/jpeg;base64,AAA")).toBe(false);
    expect(isBucketKey("https://example.com/x.jpg")).toBe(false);
    expect(isBucketKey("")).toBe(false);
    expect(isBucketKey(undefined)).toBe(false);
    expect(isBucketKey(null)).toBe(false);
    expect(isBucketKey(42)).toBe(false);
  });
  it("buildStorageValue prefixes with s3:characters/", () => {
    expect(buildStorageValue("1-123.jpg")).toBe("s3:characters/1-123.jpg");
    expect(buildStorageValue("/1-123.jpg")).toBe("s3:characters/1-123.jpg");
  });
  it("parseBucketKey returns the object key", () => {
    expect(parseBucketKey("s3:characters/1-123.jpg")).toBe("1-123.jpg");
    expect(parseBucketKey("data:image/jpeg;base64,AAA")).toBeNull();
    expect(parseBucketKey("")).toBeNull();
    expect(parseBucketKey(undefined)).toBeNull();
  });
  it("stripBucketPrefix removes s3: and passes legacy values through", () => {
    expect(stripBucketPrefix("s3:characters/1-123.jpg")).toBe("characters/1-123.jpg");
    const legacy = "data:image/jpeg;base64,AAA";
    expect(stripBucketPrefix(legacy)).toBe(legacy);
  });
  it("round-trips build -> parse", () => {
    const stored = buildStorageValue("7-999.webp");
    expect(isBucketKey(stored)).toBe(true);
    expect(parseBucketKey(stored)).toBe("7-999.webp");
  });
});
