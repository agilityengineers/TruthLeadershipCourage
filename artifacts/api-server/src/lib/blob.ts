import { createHash, createHmac } from "node:crypto";

/**
 * Minimal S3-compatible object upload using AWS Signature V4 — no SDK dependency.
 * Works with AWS S3, Cloudflare R2, MinIO, etc. Configured entirely via env so a
 * deploy without S3 degrades gracefully: when the env is absent,
 * `isBlobConfigured()` is false and the admin UI falls back to URL-paste only.
 *
 * Env: S3_BUCKET, S3_REGION (default us-east-1), S3_ACCESS_KEY_ID,
 * S3_SECRET_ACCESS_KEY, optional S3_ENDPOINT (R2/MinIO), optional
 * S3_PUBLIC_BASE_URL (CDN/bucket domain for reads).
 */

interface S3Config {
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint?: string;
  publicBaseUrl?: string;
}

export function getBlobConfig(): S3Config | null {
  const bucket = process.env["S3_BUCKET"];
  const accessKeyId = process.env["S3_ACCESS_KEY_ID"];
  const secretAccessKey = process.env["S3_SECRET_ACCESS_KEY"];
  if (!bucket || !accessKeyId || !secretAccessKey) return null;
  return {
    bucket,
    region: process.env["S3_REGION"] || "us-east-1",
    accessKeyId,
    secretAccessKey,
    endpoint: process.env["S3_ENDPOINT"] || undefined,
    publicBaseUrl: process.env["S3_PUBLIC_BASE_URL"] || undefined,
  };
}

export function isBlobConfigured(): boolean {
  return getBlobConfig() !== null;
}

function hmac(key: Buffer | string, data: string): Buffer {
  return createHmac("sha256", key).update(data, "utf8").digest();
}

function sha256Hex(data: Buffer | string): string {
  return createHash("sha256").update(data).digest("hex");
}

function uriEncodeKey(key: string): string {
  return key
    .split("/")
    .map((seg) => encodeURIComponent(seg))
    .join("/");
}

/** Upload an object and return its public URL. Throws if S3 is not configured. */
export async function putObject(key: string, body: Buffer, contentType: string): Promise<string> {
  const cfg = getBlobConfig();
  if (!cfg) throw new Error("Image storage is not configured (missing S3_* env).");

  const encodedKey = uriEncodeKey(key);
  let host: string;
  let canonicalUri: string;
  if (cfg.endpoint) {
    host = new URL(cfg.endpoint).host;
    canonicalUri = `/${cfg.bucket}/${encodedKey}`;
  } else {
    host = `${cfg.bucket}.s3.${cfg.region}.amazonaws.com`;
    canonicalUri = `/${encodedKey}`;
  }

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = sha256Hex(body);
  const service = "s3";

  const canonicalHeaders =
    `content-type:${contentType}\n` +
    `host:${host}\n` +
    `x-amz-content-sha256:${payloadHash}\n` +
    `x-amz-date:${amzDate}\n`;
  const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";

  const canonicalRequest = ["PUT", canonicalUri, "", canonicalHeaders, signedHeaders, payloadHash].join("\n");

  const scope = `${dateStamp}/${cfg.region}/${service}/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, scope, sha256Hex(canonicalRequest)].join("\n");

  const kDate = hmac(`AWS4${cfg.secretAccessKey}`, dateStamp);
  const kRegion = hmac(kDate, cfg.region);
  const kService = hmac(kRegion, service);
  const kSigning = hmac(kService, "aws4_request");
  const signature = createHmac("sha256", kSigning).update(stringToSign, "utf8").digest("hex");

  const authorization =
    `AWS4-HMAC-SHA256 Credential=${cfg.accessKeyId}/${scope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const url = `https://${host}${canonicalUri}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": contentType,
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": amzDate,
      Authorization: authorization,
    },
    body: new Uint8Array(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Upload failed (${res.status}): ${text.slice(0, 300)}`);
  }

  if (cfg.publicBaseUrl) {
    return `${cfg.publicBaseUrl.replace(/\/$/, "")}/${encodedKey}`;
  }
  return url;
}
