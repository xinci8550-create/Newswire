import { useState } from 'react';
import { SunIcon, MoonIcon } from './Icons';

/** Light/dark mode toggle — saved to localStorage, applies data-theme on <html>. */
export default function ThemeToggle() {
  const [theme, setTheme] = useState(
    () => document.documentElement.getAttribute('data-theme') || 'light'
  );

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('newswire-theme', next); } catch { /* ignore */ }
    setTheme(next);
  }

  return (
    <button
      className="theme-toggle"
      onClick={toggle}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label="Toggle dark mode"
    >
      {theme === 'dark' ? <SunIcon size={18} /> : <MoonIcon size={18} />}
    </button>
  );
}
