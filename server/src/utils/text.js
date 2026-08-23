import crypto from 'node:crypto';

/**
 * Normalize a title for similarity dedupe: lowercase, strip punctuation &
 * whitespace, drop common stopwords, then hash.
 */
export function normalizeTitle(title) {
  if (!title) return '';
  const STOPWORDS = new Set([
    'the','a','an','to','of','in','on','at','for','and','or','but','with','from','by','is','are','was','were','be','been','has','have','had','it','its','this','that','as','after','over','into','than','their','they','we','you','your','he','she','his','her','will','would','should','could','can','not','no','yes','what','who','how','why','when','where','do','does','did','about','more','most','some','any','all','just','new','news','says','said','say','amid','the','us','uk','world','today','live','update','updates','breaking','report','reports','shows','show','after','before','while','out','up','down','not','so','too','very','also','still','again','more','such','only','own','same','than','then','there','these','those'
  ]);
  const cleaned = title
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter((w) => w.length > 1 && !STOPWORDS.has(w));
  return cleaned.join(' ');
}

/** Compute a fingerprint (first 16 hex of SHA-256 of the normalized title). */
export function fingerprint(title) {
  const norm = normalizeTitle(title);
  if (!norm) return null;
  return crypto.createHash('sha256').update(norm).digest('hex').slice(0, 16);
}

/** Turn a published date (Date | number | string) into epoch ms or null. */
export function toEpochMs(value) {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.getTime();
}
