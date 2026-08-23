export function Loader({ label = 'Loading…' }) {
  return (
    <div className="loader">
      <div className="spinner" />
      <span>{label}</span>
    </div>
  );
}

// Minimal line-art clock icon (used instead of the clock emoji).
export function ClockIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v4.5l2.7 1.8" />
    </svg>
  );
}

// Minimal line-art heart icon (favorites empty state).
export function HeartIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 20.2 4.8 13a4.6 4.6 0 0 1 0-6.5 4.6 4.6 0 0 1 6.5 0l.7.7.7-.7a4.6 4.6 0 0 1 6.5 0 4.6 4.6 0 0 1 0 6.5Z" />
    </svg>
  );
}

export function Empty({ icon, title = 'Nothing here yet', message, action }) {
  return (
    <div className="empty">
      <div className="big">{icon}</div>
      <h3>{title}</h3>
      {message ? <p>{message}</p> : null}
      {action}
    </div>
  );
}

// ---------- Skeleton loading ----------
export function SkeletonCard() {
  return (
    <div className="card skeleton-card" aria-hidden="true">
      <div className="thumb-banner skeleton-banner" />
      <div className="body">
        <div className="meta"><span className="skeleton-line w40" /></div>
        <span className="skeleton-line w90" />
        <span className="skeleton-line w72" />
        <div className="foot actions"><span className="skeleton-line w30" /></div>
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 6, columns = 3 }) {
  return (
    <div className={`grid ${columns === 2 ? 'two' : ''}`}>
      {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
    </div>
  );
}
