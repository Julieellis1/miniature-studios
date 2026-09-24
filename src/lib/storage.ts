// src/lib/storage.ts — S3-compatible Neon private bucket `characters`.
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const bucketName = "characters";
export const STORAGE_PREFIX = "s3:";

function env(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim() ? v : undefined;
}

export const storageConfigured =
  Boolean(env("AWS_ACCESS_KEY_ID")) &&
  Boolean(env("AWS_SECRET_ACCESS_KEY")) &&
  Boolean(env("AWS_ENDPOINT_URL_S3"));

let _client: S3Client | null = null;

function client(): S3Client {
  if (!storageConfigured) {
    throw Object.assign(new Error("Neon storage not configured"), { status: 503 });
  }
  if (!_client) {
    _client = new S3Client({
      region: env("AWS_REGION") ?? "auto",
      endpoint: env("AWS_ENDPOINT_URL_S3"),
      credentials: {
        accessKeyId: env("AWS_ACCESS_KEY_ID") ?? "",
        secretAccessKey: env("AWS_SECRET_ACCESS_KEY") ?? "",
      },
      forcePathStyle: true,
    });
  }
  return _client;
}

/** True when a DB imageUrl value is a bucket key reference (`s3:characters/<key>`). */
export function isBucketKey(v: unknown): boolean {
  return typeof v === "string" && v.startsWith(STORAGE_PREFIX);
}

/** Strip the `s3:` prefix → `characters/<key>`. Pass-through if not a bucket key. */
export function stripBucketPrefix(v: string): string {
  return isBucketKey(v) ? v.slice(STORAGE_PREFIX.length) : v;
}

/** Build a DB value from object key parts. Key inside bucket excludes `characters/` prefix duplication handling. */
export function buildStorageValue(key: string): string {
  const clean = key.replace(/^\/+/, "");
  return `${STORAGE_PREFIX}${bucketName}/${clean}`;
}

/** Parse `s3:characters/<key>` → object key `<key>` (relative to bucket). Returns null if not a bucket key. */
export function parseBucketKey(v: unknown): string | null {
  if (!isBucketKey(v)) return null;
  const rest = (v as string).slice(STORAGE_PREFIX.length);
  const prefix = `${bucketName}/`;
  if (!rest.startsWith(prefix)) return rest;
  return rest.slice(prefix.length);
}

export async function putCharacterImage(key: string, bytes: Uint8Array | Buffer, contentType: string): Promise<void> {
  const c = client();
  await c.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: bytes,
      ContentType: contentType,
    })
  );
}

export async function getCharacterImageUrl(key: string, expiresIn = 3600): Promise<string> {
  const c = client();
  return getSignedUrl(c, new GetObjectCommand({ Bucket: bucketName, Key: key }), { expiresIn });
}

export async function deleteCharacterImage(key: string): Promise<void> {
  const c = client();
  await c.send(new DeleteObjectCommand({ Bucket: bucketName, Key: key }));
}
