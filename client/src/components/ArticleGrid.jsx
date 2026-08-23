import ArticleCard from './ArticleCard';
import { Empty, SkeletonGrid } from './States';
import { AlertIcon } from './Icons';

export default function ArticleGrid({ articles, loading, error, onRetry, empty, columns = 3 }) {
  if (loading && !articles?.length) return <SkeletonGrid count={6} columns={columns} />;
  if (error && !articles?.length) {
    return (
      <Empty
        icon={<AlertIcon />}
        title="Couldn’t load articles"
        message={error}
        action={onRetry ? <button className="btn ghost" onClick={onRetry}>Try again</button> : null}
      />
    );
  }
  if (!articles?.length) {
    return <Empty {...empty} />;
  }
  return (
    <div className={`grid ${columns === 2 ? 'two' : ''}`}>
      {articles.map((a) => <ArticleCard key={a.id} article={a} />)}
    </div>
  );
}
