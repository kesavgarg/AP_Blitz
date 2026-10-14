import "server-only";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
let warned = false;

function memoryLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const existing = buckets.get(key);
  if (!existing || existing.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }
  if (existing.count >= limit) return { ok: false, remaining: 0 };
  existing.count += 1;
  return { ok: true, remaining: limit - existing.count };
}

async function sharedLimit(key: string, limit: number, windowMs: number) {
  const base = process.env.UPSTASH_REDIS_REST_URL?.replace(/\/$/, "");
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!base || !token) return null;
  const redisKey = `rl:${key}`;
  const windowSec = Math.max(1, Math.ceil(windowMs / 1000));
  const response = await fetch(`${base}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify([
      ["INCR", redisKey],
      ["EXPIRE", redisKey, windowSec, "NX"],
    ]),
  });
  if (!response.ok) throw new Error(`rate limit store returned ${response.status}`);
  const body = (await response.json()) as { result?: unknown }[];
  const count = Number(body?.[0]?.result);
  if (!Number.isFinite(count)) throw new Error("rate limit store returned an unexpected count");
  return { ok: count <= limit, remaining: Math.max(0, limit - count) };
}

/** Shared limiter when Upstash is configured. Memory fallback is per-instance only. */
export async function rateLimit(key: string, limit: number, windowMs: number) {
  try {
    const shared = await sharedLimit(key, limit, windowMs);
    if (shared) return shared;
  } catch (err) {
    console.error("[rate-limit]", err);
  }
  if (process.env.NODE_ENV === "production" && !warned) {
    warned = true;
    console.error("[rate-limit] UPSTASH_REDIS_REST_URL is not set. Limits are not shared across instances.");
  }
  return memoryLimit(key, limit, windowMs);
}

function isIp(value: string) {
  if (value.length > 64) return false;
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(value)) {
    return value.split(".").every((part) => Number(part) <= 255);
  }
  return /^[0-9a-f:]+$/i.test(value) && value.includes(":");
}

/**
 * Platform-set addresses only. A client-supplied x-forwarded-for is ignored
 * because the first hop can be spoofed.
 */
export function clientIp(headers: Headers) {
  const vercel = headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ?? "";
  if (isIp(vercel)) return vercel;
  const real = headers.get("x-real-ip")?.trim() ?? "";
  if (isIp(real)) return real;
  return "unknown";
}
