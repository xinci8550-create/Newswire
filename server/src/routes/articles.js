import { Router } from 'express';
import { listArticles, findById, setCategory, incrementViews, relatedArticles, coverageFor } from '../models/articles.js';
import { isFavorited } from '../models/favorites.js';
import { optionalAuth, requireAuth } from '../auth/middleware.js';
import { getDb } from '../db/database.js';
import { getDaily } from '../services/daily.js';

const router = Router();
export const CATEGORIES = ['AI', 'Finance', 'Politics', 'Tech', 'Business', 'Entertainment', 'Other'];

async function decorateFavorite(userId, article) {
  if (!userId || !article) return article;
  article.favorited = await isFavorited(userId, article.id);
  return article;
}

// GET /api/categories -> list with article counts
router.get('/api/categories', async (_req, res, next) => {
  try {
    const rows = await getDb().all(
      `SELECT category, COUNT(*) AS n FROM articles GROUP BY category ORDER BY n DESC`
    );
    const counts = {};
    for (const c of CATEGORIES) counts[c] = 0;
    for (const r of rows) if (counts[r.category] !== undefined) counts[r.category] = Number(r.n);
    const list = CATEGORIES.map((key) => ({ key, label: key, displayLabel: key, count: counts[key] }));
    // Include "其他" even if only "Other" indexed.
    return res.json({ categories: list });
  } catch (e) {
    next(e);
  }
});

// GET /api/daily -> today's curated "must-read" top 10 (scored + category-balanced)
router.get('/api/daily', optionalAuth, async (req, res, next) => {
  try {
    const articles = await getDaily();
    if (req.user) {
      await Promise.all(articles.map((a) => decorateFavorite(req.user.id, a)));
    }
    return res.json({ date: new Date().toISOString().slice(0, 10), articles });
  } catch (e) {
    next(e);
  }
});

// GET /api/articles
router.get('/api/articles', optionalAuth, async (req, res, next) => {
  try {
    const { category, sourceId, q, order } = req.query;
    const limit = Math.min(parseInt(req.query.limit, 10) || 24, 100);
    const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);
    const since = parseInt(req.query.since, 10) > 0 ? Number(req.query.since) : 0;
    const result = await listArticles({
      category: category ? String(category) : undefined,
      sourceId: sourceId ? Number(sourceId) : undefined,
      q: q ? String(q) : undefined,
      order: order || 'new',
      limit,
      offset,
      since,
    });
    if (req.user) {
      await Promise.all(result.articles.map((a) => decorateFavorite(req.user.id, a)));
    }
    return res.json(result);
  } catch (e) {
    next(e);
  }
});

// GET /api/articles/:id -> detail
router.get('/api/articles/:id', optionalAuth, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Bad id' });
    const article = await findById(id);
    if (!article) return res.status(404).json({ error: 'Article not found' });
    if (req.user) await decorateFavorite(req.user.id, article);
    article.coverage = await coverageFor(id);
    return res.json({ article });
  } catch (e) {
    next(e);
  }
});

// POST /api/articles/:id/view -> count a view (any visitor); also records
// history when the request is authenticated.
router.post('/api/articles/:id/view', optionalAuth, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Bad id' });
    const views = await incrementViews(id);
    if (views === null) return res.status(404).json({ error: 'Article not found' });
    if (req.user) {
      const { recordView } = await import('../models/history.js');
      await recordView(req.user.id, id);
    }
    return res.json({ ok: true, views });
  } catch (e) {
    next(e);
  }
});

// GET /api/articles/:id/related -> similar-category articles
router.get('/api/articles/:id/related', optionalAuth, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Bad id' });
    const article = await findById(id);
    if (!article) return res.status(404).json({ error: 'Article not found' });
    const limit = Math.min(parseInt(req.query.limit, 10) || 6, 12);
    const related = await relatedArticles(id, { limit });
    if (req.user) {
      await Promise.all(related.map((a) => decorateFavorite(req.user.id, a)));
    }
    return res.json({ articles: related });
  } catch (e) {
    next(e);
  }
});

// Admin-ish: PATCH /api/articles/:id/category (classified correction)
router.patch('/api/articles/:id/category', requireAuth, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { category } = req.body || {};
    if (!CATEGORIES.includes(category)) return res.status(400).json({ error: 'Invalid category' });
    const article = await setCategory(id, category);
    if (!article) return res.status(404).json({ error: 'Article not found' });
    return res.json({ article });
  } catch (e) {
    next(e);
  }
});

export default router;
