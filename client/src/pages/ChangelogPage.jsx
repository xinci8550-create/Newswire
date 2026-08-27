import { useEffect, useState } from 'react';
import { api } from '../api';
import Seo from '../components/Seo';
import { Loader, Empty } from '../components/States';

const TYPE_META = {
  feature: { label: 'Feature', cls: 't-feature' },
  fix: { label: 'Bugfix', cls: 't-fix' },
  polish: { label: 'Polish', cls: 't-polish' },
  perf: { label: 'Perf', cls: 't-perf' },
};

export default function ChangelogPage() {
  const [entries, setEntries] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let live = true;
    api.changelog()
      .then((r) => { if (live) setEntries(r.entries || []); })
      .catch((e) => { if (live) setError(e.message); });
    return () => { live = false; };
  }, []);

  if (error) return <Empty icon="⚠️" title="Couldn't load the update log" message={error} />;
  if (!entries) return <Loader />;

  return (
    <div className="container" style={{ paddingTop: 36, paddingBottom: 40, maxWidth: 760 }}>
      <Seo title="What's New" description="The Newswire update log — what changed each release." />
      <div className="section-head"><h2>What&rsquo;s New</h2><span className="count">{entries.length} releases</span></div>
      <p className="muted" style={{ marginTop: -8, marginBottom: 20 }}>
        A running log of every improvement, tagged by type. Newer releases are on top.
      </p>
      <div className="changelog-list">
        {entries.map((e) => (
          <div key={e.version} className="changelog-entry">
            <div className="changelog-head">
              <span className="changelog-version">{e.version}</span>
            </div>
            <h3 className="changelog-title">{e.title}</h3>
            <ul className="changelog-items">
              {(e.items || []).map((it, i) => {
                const t = typeof it === 'string' ? { type: 'feature', text: it } : it;
                const meta = TYPE_META[t.type] || TYPE_META.feature;
                return (
                  <li key={i}>
                    <span className={`changelog-badge ${meta.cls}`}>{meta.label}</span>
                    <span>{t.text}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
