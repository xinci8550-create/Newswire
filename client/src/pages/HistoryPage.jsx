import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import ArticleCard from '../components/ArticleCard';
import { Loader, Empty, ClockIcon } from '../components/States';

export default function HistoryPage() {
  const navigate = useNavigate();
  const [articles, setArticles] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    setLoading(true);
    setError(null);
    api.historyList({ limit: 200 })
      .then((r) => { if (live) setArticles(r.articles || []); })
      .catch((e) => { if (live) setError(e.message); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, []);

  async function clearAll() {
    if (!window.confirm('Clear your entire browsing history?')) return;
    try {
      await api.clearHistory();
      setArticles([]);
    } catch { /* ignore */ }
  }

  if (loading) return <Loader />;
  if (error) return <Empty icon="⚠️" title="Couldn’t load history" message={error} />;
  if (!articles?.length) return <Empty icon={<ClockIcon />} title="No history yet" message="Articles you open will appear here, newest first." />;

  return (
    <div className="container" style={{ paddingTop: 36, paddingBottom: 40 }}>
      <div className="section-head">
        <h2>Browsing History</h2>
        <span className="count">{articles.length} viewed</span>
        <button className="btn ghost" onClick={clearAll} style={{ marginLeft: 'auto' }}>Clear all</button>
      </div>
      <div className="grid">
        {articles.map((a) => <ArticleCard key={a.id} article={a} />)}
      </div>
    </div>
  );
}
