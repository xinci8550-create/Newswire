import { Router } from 'express';
import { listSources, createSource } from '../models/sources.js';
import { requireAuth } from '../auth/middleware.js';

const router = Router();

// GET /api/sources
router.get('/api/sources', async (_req, res, next) => {
  try {
    const sources = await listSources({});
    return res.json({ sources });
  } catch (e) {
    next(e);
  }
});

// POST /api/sources (authenticated; simple admin to add a feed)
router.post('/api/sources', requireAuth, async (req, res, next) => {
  try {
    const { name, url, feed_url, enabled } = req.body || {};
    if (!name || !url || !feed_url) return res.status(400).json({ error: 'name, url, feed_url are required' });
    const source = await createSource({ name, url, feed_url, enabled: enabled === false ? 0 : 1 });
    return res.status(201).json({ source });
  } catch (e) {
    next(e);
  }
});

export default router;
