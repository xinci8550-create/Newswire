import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CATEGORIES } from '../lib';
import { useCategories } from '../hooks';

export function CategoryTabs({ counts = {}, active = 'All' }) {
  return (
    <div className="cat-tabs">
      {CATEGORIES.map((c) => (
        <Link
          key={c.key}
          to={c.key === 'All' ? '/' : `/category/${c.key}`}
          className={c.key === active ? 'active' : ''}
        >
          {c.label}
          {counts[c.key] !== undefined ? <span className="num">{counts[c.key]}</span> : null}
        </Link>
      ))}
    </div>
  );
}

/** Category switcher with live counts, for use on any page. */
export function CategoryBar({ active = null }) {
  const cats = useCategories();
  const counts = Object.fromEntries(cats.map((c) => [c.key, c.count]));
  counts.All = cats.reduce((s, c) => s + (c.count || 0), 0);
  return <CategoryTabs counts={counts} active={active || null} />;
}

export function Pager({ offset, limit, total, onPage }) {
  const page = Math.floor(offset / limit) + 1;
  const pages = Math.max(1, Math.ceil(total / limit));
  const [input, setInput] = useState(String(page));
  useEffect(() => { setInput(String(page)); }, [page]);

  if (pages <= 1) return null;

  function go() {
    const n = parseInt(input, 10);
    if (!Number.isFinite(n)) { setInput(String(page)); return; }
    const clamped = Math.min(Math.max(1, n), pages);
    if (clamped !== page) onPage(clamped);
    setInput(String(clamped));
  }

  return (
    <div className="pager">
      <button className="btn ghost" disabled={page <= 1} onClick={() => onPage(page - 1)}>← Prev</button>
      <span className="pager-hint">Page</span>
      <input
        className="pager-input"
        type="number"
        min={1}
        max={pages}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); go(); } else if (e.key === 'Escape') { setInput(String(page)); } }}
        onBlur={() => setInput(String(page))}
        aria-label={`Jump to page (1–${pages})`}
      />
      <span className="pager-hint">of {pages}</span>
      <button className="btn ghost pager-go" onMouseDown={(e) => e.preventDefault()} onClick={go}>Go</button>
      <button className="btn ghost" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next →</button>
    </div>
  );
}
