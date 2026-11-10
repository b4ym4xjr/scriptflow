import { headers } from "next/headers";

/**
 * Small fixed-window rate limiter.
 *
 * NOTE: state lives in this server instance's memory. On a single Node server
 * that is a real limit; on serverless (e.g. Vercel) each warm instance keeps
 * its own counters, so this is a best-effort brake against scripted abuse, not
 * a hard guarantee. For a hard limit put a shared store (Upstash/Redis) or the
 * platform WAF in front, and keep calling this same helper.
 */
interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;

function sweep(now: number) {
  if (buckets.size < MAX_BUCKETS) return;
  for (const [key, b] of buckets) {
    if (b.resetAt <= now) buckets.delete(key);
  }
  // Still too big (sustained flood): drop the oldest half.
  if (buckets.size >= MAX_BUCKETS) {
    let i = 0;
    for (const key of buckets.keys()) {
      buckets.delete(key);
      if (++i >= MAX_BUCKETS / 2) break;
    }
  }
}

export interface RateLimitResult {
  ok: boolean;
  /** Seconds until the window resets (only meaningful when !ok). */
  retryAfter: number;
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }
  bucket.count += 1;
  if (bucket.count > limit) {
    return { ok: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  return { ok: true, retryAfter: 0 };
}

/** Best-effort client IP from proxy headers (first hop). */
export function ipFromHeaders(h: Pick<Headers, "get">): string {
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim().slice(0, 64) || "unknown";
  return (h.get("x-real-ip") ?? "unknown").slice(0, 64);
}

export async function getClientIp(): Promise<string> {
  try {
    return ipFromHeaders(await headers());
  } catch {
    return "unknown";
  }
}

export function tooManyRequests(retryAfter: number) {
  const mins = Math.max(1, Math.ceil(retryAfter / 60));
  return `Too many attempts. Please try again in ${
    retryAfter < 90 ? `${Math.max(1, retryAfter)} seconds` : `${mins} minutes`
  }.`;
}
