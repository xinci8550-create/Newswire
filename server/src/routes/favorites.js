import { Router } from 'express';
import { addFavorite, removeFavorite, listFavorites, countFavorites } from '../models/favorites.js';
import { findById } from '../models/articles.js';
import { requireAuth } from '../auth/middleware.js';

const router = Router();

// GET /api/favorites
router.get('/api/favorites', requireAuth, async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 60, 200);
    const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);
    const result = await listFavorites(req.user.id, { limit, offset });
    const count = await countFavorites(req.user.id);
    return res.json({ ...result, count });
  } catch (e) {
    next(e);
  }
});

// POST /api/favorites/:articleId
router.post('/api/favorites/:articleId', requireAuth, async (req, res, next) => {
  try {
    const articleId = Number(req.params.articleId);
    if (!Number.isFinite(articleId)) return res.status(400).json({ error: 'Bad id' });
    const article = await findById(articleId);
    if (!article) return res.status(404).json({ error: 'Article not found' });
    const favorited = await addFavorite(req.user.id, articleId);
    return res.json({ favorited });
  } catch (e) {
    next(e);
  }
});

// DELETE /api/favorites/:articleId
router.delete('/api/favorites/:articleId', requireAuth, async (req, res, next) => {
  try {
    const articleId = Number(req.params.articleId);
    if (!Number.isFinite(articleId)) return res.status(400).json({ error: 'Bad id' });
    await removeFavorite(req.user.id, articleId);
    return res.json({ favorited: false });
  } catch (e) {
    next(e);
  }
});

export default router;
