import getDb from '../db/database.js';
import { toArticle } from './articles.js';

export async function addFavorite(userId, articleId) {
  await getDb().run(
    'INSERT INTO favorites (user_id, article_id, created_at) VALUES (?, ?, ?) ON CONFLICT (user_id, article_id) DO NOTHING',
    [userId, articleId, Date.now()]
  );
  return isFavorited(userId, articleId);
}

export async function removeFavorite(userId, articleId) {
  await getDb().run('DELETE FROM favorites WHERE user_id = ? AND article_id = ?', [userId, articleId]);
}

export async function isFavorited(userId, articleId) {
  const row = await getDb().get('SELECT 1 AS x FROM favorites WHERE user_id = ? AND article_id = ?', [userId, articleId]);
  return Boolean(row);
}

export async function listFavorites(userId, { limit = 60, offset = 0 } = {}) {
  const db = getDb();
  const rows = await db.all(
    `SELECT a.*, s.name AS source_name, s.url AS source_url, f.created_at AS fav_at
       FROM favorites f
       JOIN articles a ON a.id = f.article_id
       JOIN sources s ON s.id = a.source_id
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC
      LIMIT ? OFFSET ?`,
    [userId, Number(limit), Number(offset)]
  );
  const totalRow = await db.get('SELECT COUNT(*) AS n FROM favorites WHERE user_id = ?', [userId]);
  const articles = rows.map(toArticle);
  // Everything in this list is favorited, so the UI can render a filled heart.
  for (const a of articles) a.favorited = true;
  return { articles, total: Number(totalRow?.n || 0) };
}

export async function countFavorites(userId) {
  const r = await getDb().get('SELECT COUNT(*) AS n FROM favorites WHERE user_id = ?', [userId]);
  return Number(r?.n || 0);
}
