import getDb from '../db/database.js';
import config from '../config.js';
import { toArticle } from '../models/articles.js';

// Significant words = letters/digits, length >= 2, minus common stopwords.
const STOP = new Set([
  'the','a','an','to','of','in','on','at','for','and','or','but','with','from','by','is','are','was','were','be','been',
  'has','have','had','it','its','this','that','as','after','over','into','than','their','they','we','you','your','he','she',
  'his','her','will','would','should','could','can','not','no','yes','what','who','how','why','when','where','do','does',
  'did','about','more','most','some','any','all','just','new','news','says','said','say','amid','us','uk','world','today','live',
]);

function words(t) {
  return (t || '').toLowerCase().match(/[a-z0-9]{2,}/g) || [];
}

function dayKey() {
  return new Date().toISOString().slice(0, 10);
}

let cache = { date: null, articles: [] };

/**
 * Score articles published within the daily window:
 *   score = wFresh·freshness + wCross·crossSource + wAuthority·authority
 * - freshness: recency within the window (0..1)
 * - crossSource: # distinct other sources covering the same event (share >=2
 *   title words), capped at 5 -> 0..1
 * - authority: source authority (1..5) -> /5
 * Then pick the top `limit`, enforcing a per-category cap.
 */
export async function computeDaily() {
  const db = getDb();
  const windowMs = config.daily.windowHours * 3600 * 1000;
  const cutoff = Date.now() - windowMs;
  const rows = await db.all(
    `SELECT a.*, s.name AS source_name, s.url AS source_url, s.authority
       FROM articles a JOIN sources s ON s.id = a.source_id
      WHERE a.published_at >= ?
      ORDER BY a.published_at DESC
      LIMIT 400`,
    [cutoff]
  );
  if (!rows.length) return [];

  const items = rows.map((r) => ({ r, w: new Set(words(r.title)) }));

  const scored = items.map((it) => {
    const { r, w } = it;
    // Cross-source coverage: distinct OTHER sources sharing >=2 title words.
    const otherSources = new Set();
    for (const other of items) {
      if (other.r.id === r.id || other.r.source_id === r.source_id) continue;
      let shared = 0;
      for (const t of w) {
        if (other.w.has(t)) { shared += 1; if (shared >= 2) break; }
      }
      if (shared >= 2) otherSources.add(other.r.source_id);
    }
    const cross = Math.min(otherSources.size, 5) / 5;
    const age = Math.max(0, Date.now() - (r.published_at || Date.now()));
    const fresh = Math.max(0, 1 - age / windowMs);
    const auth = (Number(r.authority) || 3) / 5;
    const score =
      config.daily.wFresh * fresh + config.daily.wCross * cross + config.daily.wAuthority * auth;
    return { r, score };
  });

  scored.sort((a, b) => b.score - a.score || Number(b.r.published_at || 0) - Number(a.r.published_at || 0));

  // Enforce per-category cap while picking the top `limit`.
  const picked = [];
  const catCount = {};
  for (const s of scored) {
    const cat = s.r.category || 'Other';
    if ((catCount[cat] || 0) >= config.daily.categoryCap) continue;
    picked.push(s);
    catCount[cat] = (catCount[cat] || 0) + 1;
    if (picked.length >= config.daily.limit) break;
  }
  picked.sort((a, b) => b.score - a.score);
  return picked.map((s) => ({ ...toArticle(s.r), score: Math.round(s.score * 100) / 100 }));
}

/** Return today's daily list (cached for the day; recompute on new day). */
export async function getDaily() {
  const today = dayKey();
  if (cache.date === today && cache.articles.length) return cache.articles;
  cache = { date: today, articles: await computeDaily() };
  return cache.articles;
}
