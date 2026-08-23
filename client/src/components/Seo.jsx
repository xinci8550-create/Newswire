import { useEffect } from 'react';

function upsertMeta(attr, name, content) {
  if (!content) return;
  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

/**
 * Client-side SEO/social meta management. Sets document title and
 * description/OG/Twitter tags for the current page (best-effort for JS-capable
 * crawlers and, importantly, for rich link previews when sharing).
 */
export default function Seo({ title = 'Newswire', description = '', image = '', type = 'website' }) {
  useEffect(() => {
    document.title = title === 'Newswire' ? 'Newswire — Multi-Source News' : `${title} — Newswire`;
    upsertMeta('name', 'description', description);
    upsertMeta('property', 'og:title', title);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:image', image);
    upsertMeta('property', 'og:type', type);
    upsertMeta('property', 'og:site_name', 'Newswire');
    upsertMeta('name', 'twitter:card', 'summary_large_image');
    if (image) upsertMeta('name', 'twitter:image', image);
  }, [title, description, image, type]);
  return null;
}
