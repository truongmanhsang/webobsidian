import type { Request, Response, NextFunction } from 'express';

/**
 * In-memory sliding-window brute-force guard for the login endpoint. Keyed by
 * client IP. Single-process app (no DB), so an in-memory map is sufficient; it
 * resets on restart, which is fine for throttling interactive guessing.
 */
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 10; // per window per IP

const attempts = new Map<string, number[]>();

function clientIp(req: Request): string {
  // `trust proxy` is set, so req.ip honours X-Forwarded-For from the trusted proxy.
  return req.ip || req.socket.remoteAddress || 'unknown';
}

export function loginRateLimit(req: Request, res: Response, next: NextFunction): void {
  const ip = clientIp(req);
  const now = Date.now();
  const recent = (attempts.get(ip) ?? []).filter((t) => t > now - WINDOW_MS);
  if (recent.length >= MAX_ATTEMPTS) {
    const retryAfter = Math.ceil((recent[0] + WINDOW_MS - now) / 1000);
    res.setHeader('Retry-After', String(retryAfter));
    res.status(429).json({ error: 'Too many login attempts. Try again later.', retryAfter });
    return;
  }
  recent.push(now);
  attempts.set(ip, recent);
  // Opportunistic cleanup so the map can't grow unbounded across many IPs.
  if (attempts.size > 10_000) {
    for (const [k, v] of attempts) {
      if (v.every((t) => t <= now - WINDOW_MS)) attempts.delete(k);
    }
  }
  next();
}
