import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { categoryGlassGradient, formatTime } from '../lib';

/** Homepage "Today's Must-Reads": a compact strip of the top 3 daily picks. */
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
        <Link className="daily-more" to="/daily">Full brief →</Link>
      </div>
      <div className="daily-strip">
        {items.map((a, i) => (
          <Link key={a.id} className="daily-row" to={`/article/${a.id}`}>
            <span className="daily-row-num">{i + 1}</span>
            <span className="daily-row-accent" style={{ background: categoryGlassGradient(a.category) }} />
            <span className="daily-row-text">
              <span className="daily-row-title">{a.title}</span>
              <span className="meta">
                <span className="cat">{a.category}</span>
                <span className="dot" />
                <span>{formatTime(a.publishedAt)}</span>
                <span className="dot" />
                <span className="src">{a.sourceName}</span>
              </span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
