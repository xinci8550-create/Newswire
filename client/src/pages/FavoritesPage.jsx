import { useEffect, useState } from 'react';
import { api } from '../api';
import ArticleCard from '../components/ArticleCard';
import { Loader, Empty, HeartIcon } from '../components/States';

export default function FavoritesPage() {
  const [articles, setArticles] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    setLoading(true);
    setError(null);
    api.favoritesList({ limit: 200 })
      .then((r) => { if (live) setArticles(r.articles || []); })
      .catch((e) => { if (live) setError(e.message); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, []);

  function onChanged(isOn, id) {
    if (!isOn) setArticles((prev) => (prev || []).filter((a) => a.id !== id));
  }

  if (loading) return <Loader />;
  if (error) return <Empty icon="⚠️" title="Couldn’t load favorites" message={error} />;
  if (!articles?.length) return <Empty icon={<HeartIcon />} title="No favorites yet" message="Tap the heart on any article to save it here." />;

  return (
    <div className="container" style={{ paddingTop: 36, paddingBottom: 40 }}>
      <div className="section-head">
        <h2>My Favorites</h2>
        <span className="count">{articles.length} saved</span>
      </div>
      <div className="grid">
        {articles.map((a) => <ArticleCard key={a.id} article={a} onFavoriteChanged={onChanged} />)}
      </div>
    </div>
  );
}
