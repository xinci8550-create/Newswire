import getDb from '../db/database.js';
import config from '../config.js';
import { toArticle } from './articles.js';

/**
 * Record a view. A user's history keeps one entry per article (most recent
 * view wins), so we delete previous rows for the same user+article then insert.
 */
export async function recordView(userId, articleId) {
  const now = Date.now();
  const db = getDb();
  // Verify the article exists before recording.
  const article = await db.get('SELECT id FROM articles WHERE id = ?', [articleId]);
  if (!article) return false;
  await db.run('DELETE FROM history WHERE user_id = ? AND article_id = ?', [userId, articleId]);
  await db.run('INSERT INTO history (user_id, article_id, viewed_at) VALUES (?, ?, ?)', [userId, articleId, now]);
  // Cap each user's history to the newest HISTORY_LIMIT rows.
  const limit = config.scrape.historyLimit;
  if (limit && limit > 0) {
    await db.run(
      `DELETE FROM history
        WHERE user_id = ?
          AND id NOT IN (
            SELECT id FROM history WHERE user_id = ? ORDER BY viewed_at DESC LIMIT ?
          )`,
      [userId, userId, limit]
    );
  }
  return true;
}

export async function listHistory(userId, { limit = 60, offset = 0 } = {}) {
  const db = getDb();
  const rows = await db.all(
    `SELECT a.*, s.name AS source_name, s.url AS source_url, h.viewed_at
       FROM history h
       JOIN articles a ON a.id = h.article_id
       JOIN sources s ON s.id = a.source_id
      WHERE h.user_id = ?
      ORDER BY h.viewed_at DESC
      LIMIT ? OFFSET ?`,
    [userId, Number(limit), Number(offset)]
  );
  const totalRow = await db.get('SELECT COUNT(*) AS n FROM history WHERE user_id = ?', [userId]);
  return { articles: rows.map(toArticle), total: Number(totalRow?.n || 0) };
}

export async function clearHistory(userId) {
  await getDb().run('DELETE FROM history WHERE user_id = ?', [userId]);
}
