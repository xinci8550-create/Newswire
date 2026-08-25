import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { categoryGlassGradient, formatTime } from '../lib';
import FavoriteButton from './FavoriteButton';

/** Homepage "Today's Must-Reads": the top 3 daily picks as prominent cards. */
export default function DailyHighlights() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    let live = true;
    api.daily()
      .then((r) => { if (live) setItems((r.articles || []).slice(0, 3)); })
      .catch(() => {});
    return () => { live = false; };
  }, []);

  if (!items.length) return null;

  return (
    <section className="daily">
      <div className="section-head">
        <h2>Today&rsquo;s Must-Reads</h2>
        <span className="count">Top {items.length}</span>
      </div>
      <div className="daily-grid">
        {items.map((a, i) => (
          <article key={a.id} className="card daily-card">
            <Link className="daily-cover" to={`/article/${a.id}`} style={{ background: categoryGlassGradient(a.category) }}>
              <span className="daily-rank">#{i + 1}</span>
            </Link>
            <div className="body">
              <div className="meta">
                <span className="cat">{a.category}</span>
                <span className="dot" />
                <span>{formatTime(a.publishedAt)}</span>
              </div>
              <h3><Link to={`/article/${a.id}`}>{a.title}</Link></h3>
              {a.summary ? <p className="summary">{a.summary}</p> : null}
              <div className="foot actions">
                <a className="source-chip" href={a.url} target="_blank" rel="noopener noreferrer">
                  <span className="dot" /> {a.sourceName} <span className="ext">↗</span>
                </a>
                <FavoriteButton articleId={a.id} initial={a.favorited} />
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
