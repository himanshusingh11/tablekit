import { useMemo } from 'react';
import { DataTable, useTable } from 'react-tablekit';
import 'react-tablekit/styles.css';
import { personColumns } from '../columns';
import { makePeople } from '../data';

export function LargeExample() {
  // 100,000 rows. Only ~25 DOM rows exist at any time.
  const data = useMemo(() => makePeople(100_000), []);
  const table = useTable({ data, columns: personColumns, getRowId: (r) => r.id });

  return (
    <div>
      <div className="toolbar">
        <input
          className="search"
          type="search"
          placeholder="Search 100,000 people…"
          aria-label="Search people"
          value={table.state.globalFilter}
          onChange={(e) => table.setGlobalFilter(e.target.value)}
        />
        <select
          aria-label="Filter by department"
          value={table.getColumnFilter('department')}
          onChange={(e) => table.setColumnFilter('department', e.target.value)}
        >
          <option value="">All departments</option>
          {[
            'Engineering',
            'Design',
            'Sales',
            'Support',
            'Finance',
            'Marketing',
            'Legal',
            'Operations',
          ].map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
        <label className="check">
          <input
            type="checkbox"
            checked={table.state.columnPinning.includes('name')}
            onChange={() => table.toggleColumnPinned('name')}
          />
          Pin “Name”
        </label>
        <span className="muted">{table.rows.length.toLocaleString()} rows</span>
      </div>
      <DataTable table={table} height={520} rowHeight={36} aria-label="People (100K rows)" />
    </div>
  );
}
