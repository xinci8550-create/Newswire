import { useEffect, useState } from 'react';
import { api } from '../api';

const RANGES = [['', 'Any time'], ['1d', 'Past 24 hours'], ['3d', 'Past 3 days'], ['7d', 'Past week']];
export const RANGE_MS = { '1d': 86400000, '3d': 3 * 86400000, '7d': 7 * 86400000 };

/** Source + time-range filter controls. `onChange({source, range})`. */
export default function FilterBar({ source, range, onChange }) {
  const [sources, setSources] = useState([]);
  useEffect(() => { api.sources().then((r) => setSources(r.sources || [])).catch(() => {}); }, []);

  return (
    <div className="filter-bar">
      <select className="filter-select" aria-label="Filter by source" value={source} onChange={(e) => onChange({ source: e.target.value })}>
        <option value="">All sources</option>
        {sources.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
      <select className="filter-select" aria-label="Filter by time" value={range} onChange={(e) => onChange({ range: e.target.value })}>
        {RANGES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );
}
