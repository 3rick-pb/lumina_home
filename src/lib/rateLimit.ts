import { NextResponse } from 'next/server';

interface RateLimitRecord {
  timestamps: number[];
}

// In-memory store for rate limiting by identifier (IP / key)
const rateLimitStore = new Map<string, RateLimitRecord>();

// Periodic cleanup every 5 minutes to prevent memory leak
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    rateLimitStore.forEach((record, key) => {
      // Keep only timestamps from the last 15 minutes
      const validTimestamps = record.timestamps.filter(ts => now - ts < 15 * 60 * 1000);
      if (validTimestamps.length === 0) {
        rateLimitStore.delete(key);
      } else {
        record.timestamps = validTimestamps;
      }
    });
  }, 5 * 60 * 1000);
}

/**
 * Extracts client IP address reliably from standard proxy/CDN headers
 */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const ips = forwardedFor.split(',').map(ip => ip.trim());
    if (ips.length > 0 && ips[0]) return ips[0];
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp) return cfConnectingIp.trim();

  return '127.0.0.1';
}

export interface RateLimitOptions {
  keyPrefix?: string;
  maxRequests: number;
  windowMs: number;
}

export interface RateLimitResult {
  isAllowed: boolean;
  remaining: number;
  resetTimeMs: number;
  totalHits: number;
}

/**
 * Evaluates rate limit for a given request using sliding window algorithm.
 */
export function checkRateLimit(
  request: Request,
  options: RateLimitOptions
): RateLimitResult {
  const ip = getClientIp(request);
  const prefix = options.keyPrefix || 'global';
  const bucketKey = `${prefix}:${ip}`;
  const now = Date.now();
  const windowStart = now - options.windowMs;

  let record = rateLimitStore.get(bucketKey);
  if (!record) {
    record = { timestamps: [] };
    rateLimitStore.set(bucketKey, record);
  }

  // Filter timestamps outside current rolling window
  record.timestamps = record.timestamps.filter(ts => ts > windowStart);

  const totalHits = record.timestamps.length;
  const isAllowed = totalHits < options.maxRequests;

  if (isAllowed) {
    record.timestamps.push(now);
  }

  const remaining = Math.max(0, options.maxRequests - record.timestamps.length);
  const oldestTimestamp = record.timestamps[0] || now;
  const resetTimeMs = Math.max(0, oldestTimestamp + options.windowMs - now);

  return {
    isAllowed,
    remaining,
    resetTimeMs,
    totalHits: record.timestamps.length,
  };
}

/**
 * Creates a standard HTTP 429 Too Many Requests response with security headers
 */
export function createRateLimitResponse(
  message = 'Demasiadas solicitudes. Por favor, intenta de nuevo en unos momentos.',
  resetTimeMs = 60000
): NextResponse {
  const retryAfterSeconds = Math.ceil(resetTimeMs / 1000);
  return NextResponse.json(
    {
      success: false,
      error: message,
      retryAfter: retryAfterSeconds,
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfterSeconds),
        'X-RateLimit-Limit': 'Exceeded',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }
  );
}
