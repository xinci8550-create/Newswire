// Simple in-memory sliding-window rate limiter (per key/IP). Good enough for
// auth + cron endpoints; swap for a shared store (Redis) when scaling out.

const buckets = new Map();

export function rateLimit({ windowMs = 60000, max = 10, keyFn = (req) => req.ip }) {
  return (req, res, next) => {
    const key = keyFn(req);
    const now = Date.now();
    let rec = buckets.get(key);
    if (!rec || rec.reset <= now) {
      rec = { count: 0, reset: now + windowMs };
      buckets.set(key, rec);
    }
    rec.count += 1;
    res.setHeader('X-RateLimit-Limit', String(max));
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, max - rec.count)));
    if (rec.count > max) {
      return res.status(429).json({ error: 'Too many requests. Please try again in a moment.' });
    }
    next();
  };
}
