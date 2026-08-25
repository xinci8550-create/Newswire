export const CATEGORIES = [
  { key: 'All', label: 'All' },
  { key: 'AI', label: 'AI' },
  { key: 'Tech', label: 'Tech' },
  { key: 'Finance', label: 'Finance' },
  { key: 'Business', label: 'Business' },
  { key: 'Politics', label: 'Politics' },
  { key: 'Entertainment', label: 'Entertainment' },
  { key: 'Other', label: 'Other' },
];

// Slug for the "All" category is null (no filter) at the API level.
export function categoryPath(key) {
  return key === 'All' ? '/' : `/category/${encodeURIComponent(key)}`;
}

export function formatTime(epochMs) {
  if (!epochMs) return '';
  const d = new Date(epochMs);
  const now = Date.now();
  const diff = now - epochMs;
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function initials(display) {
  if (!display) return '?';
  return display.trim().slice(0, 1).toUpperCase();
}

/** Rough reading time from a text length (~200 wpm), min 1 min. */
export function readingTime(text) {
  const words = (text || '').trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.round(words / 200))} min read`;
}

// Deeper, more saturated category colors — cohesive with the site's neutral
// palette + single news-red accent.
export const CATEGORY_COLORS = {
  AI: '#4b3f9e', // deep indigo
  Tech: '#2a6d7a', // deep teal
  Finance: '#2f6e46', // forest green
  Business: '#3f5b7d', // steel blue
  Politics: '#223a66', // navy
  Entertainment: '#7c2f5b', // plum
  Other: '#6a5a4e', // warm taupe (distinct from Business's cool blue)
};

export function categoryColor(key) {
  return CATEGORY_COLORS[key] || CATEGORY_COLORS.Other;
}

// Emoji glyphs used as a refined watermark on the category banner fallback.
export const CATEGORY_ICONS = {
  AI: '🤖',
  Tech: '💡',
  Finance: '📈',
  Business: '💼',
  Politics: '🏛️',
  Entertainment: '🎬',
  Other: '📰',
};

export function categoryIcon(key) {
  return CATEGORY_ICONS[key] || CATEGORY_ICONS.Other;
}

function hexToRgb(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m
    ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) }
    : { r: 80, g: 80, b: 80 };
}

function darken(hex, factor) {
  const { r, g, b } = hexToRgb(hex);
  const d = (v) => Math.max(0, Math.round(v * factor));
  return `rgb(${d(r)},${d(g)},${d(b)})`;
}

function lighten(hex, factor) {
  const { r, g, b } = hexToRgb(hex);
  const l = (v) => Math.round(v + (255 - v) * factor);
  return `rgb(${l(r)},${l(g)},${l(b)})`;
}

function alpha(hex, a) {
  const { r, g, b } = hexToRgb(hex);
  const h = (v) => v.toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}${Math.round(a * 255).toString(16).padStart(2, '0')}`;
}

/**
 * Dark, glass-like (琉璃) category banner: a near-black base tinted with the
 * category color, a soft colored glow in a corner, and a diagonal light streak
 * that reads like light reflecting off glass.
 */
export function categoryGlassGradient(key) {
  const c = categoryColor(key);
  return `
    linear-gradient(115deg, rgba(255,255,255,0) 30%, rgba(255,255,255,0.05) 42%, rgba(255,255,255,0.16) 50%, rgba(255,255,255,0.05) 58%, rgba(255,255,255,0) 70%),
    radial-gradient(120% 150% at 82% 12%, ${alpha(c, 0.5)} 0%, rgba(0,0,0,0) 48%),
    linear-gradient(135deg, ${darken(c, 0.3)} 0%, ${darken(c, 0.14)} 45%, #05060a 100%)
  `;
}

/** @deprecated kept for compatibility; use categoryGlassGradient instead. */
export function categoryGradient(key) {
  return categoryGlassGradient(key);
}

/** Soft category tint overlay used over real photos for on-brand cohesion. */
export function categoryTint(key) {
  const c = categoryColor(key);
  return `linear-gradient(160deg, ${c}4d 0%, transparent 60%)`;
}
