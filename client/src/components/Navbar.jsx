import { useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth';
import { initials } from '../lib';
import { SearchIcon } from './Icons';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const { user, logout, updateName } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [q, setQ] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');

  const cats = [['/', 'All']];

  function submit(e) {
    e.preventDefault();
    const term = q.trim();
    if (term) navigate(`/search?q=${encodeURIComponent(term)}`);
  }

  async function doLogout() {
    await logout();
    navigate('/');
  }

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link to="/" className="logo">
          Newswire
        </Link>

        <nav className="nav">
          {cats.map(([to, label]) => (
            <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => (isActive ? 'active' : '')}>
              {label}
            </NavLink>
          ))}
          <NavLink to="/daily" className={({ isActive }) => (isActive ? 'active' : '')}>Daily</NavLink>
          {user && (
            <>
              <NavLink to="/favorites" className={({ isActive }) => (isActive ? 'active' : '')}>Favorites</NavLink>
              <NavLink to="/history" className={({ isActive }) => (isActive ? 'active' : '')}>History</NavLink>
            </>
          )}
        </nav>

        <div className="search">
          <form onSubmit={submit}>
            <span className="search-icon"><SearchIcon size={16} /></span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search headlines…"
              aria-label="Search"
            />
            <button type="submit">Search</button>
          </form>
        </div>

        <div className="user-menu">
          {user ? (
            <>
              <button className="avatar" title={user.name || user.email}>{initials(user.name || user.email)}</button>
              {editingName ? (
                <form
                  className="name-edit"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    await updateName(nameDraft);
                    setEditingName(false);
                  }}
                >
                  <input
                    autoFocus
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    maxLength={60}
                    placeholder="Your name"
                    onKeyDown={(e) => { if (e.key === 'Escape') setEditingName(false); }}
                    onBlur={async () => { await updateName(nameDraft); setEditingName(false); }}
                  />
                  <button type="submit" className="link-btn" style={{ color: 'var(--accent)' }}>Save</button>
                </form>
              ) : (
                <span
                  className="user-name"
                  title="Click to edit your name"
                  onClick={() => { setNameDraft(user.name || ''); setEditingName(true); }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setNameDraft(user.name || ''); setEditingName(true); }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  {user.name || user.email.split('@')[0]}
                  <span className="name-edit-hint">✎</span>
                </span>
              )}
              <button className="link-btn" onClick={doLogout}>Sign out</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn ghost">Sign in</Link>
              <Link to="/register" className="btn accent">Get started</Link>
            </>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
