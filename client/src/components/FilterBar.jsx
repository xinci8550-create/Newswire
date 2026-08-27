import { useEffect, useState } from 'react';
import { api } from '../api';
import Dropdown from './Dropdown';

const RANGES = [['', 'Any time'], ['1d', 'Past 24 hours'], ['3d', 'Past 3 days'], ['7d', 'Past week']];
export const RANGE_MS = { '1d': 86400000, '3d': 3 * 86400000, '7d': 7 * 86400000 };

/** Source + time-range filter controls. `onChange({source, range})`. */
export default function FilterBar({ source, range, onChange }) {
  const [sources, setSources] = useState([]);
  useEffect(() => { api.sources().then((r) => setSources(r.sources || [])).catch(() => {}); }, []);

  return (
    <div className="filter-bar">
      <Dropdown
        value={source}
        onChange={(v) => onChange({ source: String(v) })}
        ariaLabel="Filter by source"
        options={[{ value: '', label: 'All sources' }, ...sources.map((s) => ({ value: String(s.id), label: s.name }))]}
      />
      <Dropdown
        value={range}
        onChange={(v) => onChange({ range: String(v) })}
        ariaLabel="Filter by time"
        options={RANGES.map(([v, l]) => ({ value: v, label: l }))}
      />
    </div>
  );
}
