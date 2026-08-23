import { Router } from 'express';
import config from '../config.js';
import { triggerScrape } from '../scraper/index.js';
import { rateLimit } from '../middleware/rateLimit.js';
import getDb from '../db/database.js';

const router = Router();
const cronLimiter = rateLimit({ windowMs: 60000, max: 6 });

/**
 * POST /api/cron/trigger
 * Protected endpoint for an external scheduler (e.g. cron-job.org) to trigger a
 * scrape cycle. Authenticated with the CRON_SECRET via the `x-cron-secret`
 * header (not a user JWT).
 */
router.post('/api/cron/trigger', cronLimiter, async (req, res) => {
  const provided = req.headers['x-cron-secret'] || (req.body && req.body.secret) || '';
  if (provided !== config.scrape.cronSecret) {
    return res.status(401).json({ error: 'Invalid cron secret' });
  }
  try {
    const summary = await triggerScrape();
    return res.json({ ok: true, summary });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e && e.message || e) });
  }
});

// GET /api/scrape/health — fetch + source health for ops/monitoring
router.get('/api/scrape/health', async (_req, res, next) => {
  try {
    const db = getDb();
    const metaRows = await db.all('SELECT key, value FROM app_meta');
    const meta = {};
    for (const r of metaRows) {
      try { meta[r.key] = JSON.parse(r.value); } catch { meta[r.key] = r.value; }
    }
    const sources = await db.all('SELECT * FROM sources ORDER BY name ASC');
    const articleCount = await db.get('SELECT COUNT(*) AS n FROM articles');
    const cats = await db.all('SELECT category, COUNT(*) AS n FROM articles GROUP BY category ORDER BY n DESC');
    return res.json({
      ok: true,
      lastScrapeAt: meta.last_scrape_at || null,
      lastScrapeStats: meta.last_scrape_stats || null,
      articleCount: Number(articleCount.n),
      categoryCounts: Object.fromEntries(cats.map((c) => [c.category, Number(c.n)])),
      sources: sources.map((s) => ({
        id: Number(s.id),
        name: s.name,
        enabled: Number(s.enabled),
        lastFetchedAt: s.last_fetched_at ? Number(s.last_fetched_at) : null,
        lastError: s.last_error || null,
        failCount: Number(s.fail_count || 0),
        nextRetryAt: s.next_retry_at ? Number(s.next_retry_at) : null,
      })),
    });
  } catch (e) {
    next(e);
  }
});

export default router;
