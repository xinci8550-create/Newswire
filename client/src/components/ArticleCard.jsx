import { Link } from 'react-router-dom';
import FavoriteButton from './FavoriteButton';
import { formatTime, categoryGlassGradient } from '../lib';

function CardThumb({ article }) {
  return (
    <Link to={`/article/${article.id}`} className="thumb" aria-label={article.title}>
      <span className="thumb-banner" style={{ background: categoryGlassGradient(article.category) }} />
    </Link>
  );
}

export default function ArticleCard({ article, onFavoriteChanged }) {
  return (
    <article className="card">
      <CardThumb article={article} />
      <div className="body">
        <div className="meta">
          <span className="cat">{article.category}</span>
          <span className="dot" />
          <span>{formatTime(article.publishedAt)}</span>
        </div>
        <h3><Link to={`/article/${article.id}`}>{article.title}</Link></h3>
        {article.summary ? <p className="summary">{article.summary}</p> : null}
        <div className="foot actions">
          <a className="source-chip" href={article.url} target="_blank" rel="noopener noreferrer" title={`Visit ${article.sourceName}`}>
            <span className="dot" />
            {article.sourceName}
            <span className="ext">↗</span>
          </a>
          <FavoriteButton articleId={article.id} initial={article.favorited} onChanged={onFavoriteChanged} />
        </div>
      </div>
    </article>
  );
}
