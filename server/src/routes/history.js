import { Router } from 'express';
import { listHistory, clearHistory } from '../models/history.js';
import { isFavorited } from '../models/favorites.js';
import { requireAuth } from '../auth/middleware.js';

const router = Router();

// GET /api/history
router.get('/api/history', requireAuth, async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 60, 200);
    const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);
    const result = await listHistory(req.user.id, { limit, offset });
    // Reflect each article's current favorite state so hearts sync with Favorites.
    await Promise.all(
      result.articles.map(async (a) => { a.favorited = await isFavorited(req.user.id, a.id); })
    );
    return res.json(result);
  } catch (e) {
    next(e);
  }
});

// DELETE /api/history
router.delete('/api/history', requireAuth, async (req, res, next) => {
  try {
    await clearHistory(req.user.id);
    return res.json({ ok: true, cleared: true });
  } catch (e) {
    next(e);
  }
});

export default router;
