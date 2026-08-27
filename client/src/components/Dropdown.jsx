import { useRef, useState, useEffect } from 'react';

/** Custom dropdown that always opens downward, styled to the site's theme. */
export default function Dropdown({ value, onChange, options, ariaLabel, className = '' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onDoc(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    function onKey(e) { if (e.key === 'Escape') setOpen(false); }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, []);

  const current = options.find((o) => String(o.value) === String(value));

  return (
    <div className={`dropdown ${className}`} ref={ref}>
      <button
        type="button"
        className="dropdown-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="dropdown-label">{current ? current.label : 'Select'}</span>
        <span className="dropdown-caret" aria-hidden="true">▾</span>
      </button>
      {open && (
        <ul className="dropdown-list" role="listbox">
          {options.map((o) => (
            <li
              key={o.value}
              role="option"
              aria-selected={String(o.value) === String(value)}
              className={String(o.value) === String(value) ? 'active' : ''}
              onClick={() => { onChange(o.value); setOpen(false); }}
            >
              {o.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
