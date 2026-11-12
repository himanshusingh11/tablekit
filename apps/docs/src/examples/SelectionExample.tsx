import { useMemo } from 'react';
import { DataTable, useTable } from '@himanshusingh11/tablekit';
import '@himanshusingh11/tablekit/styles.css';
import { personColumns } from '../columns';
import { currency, makePeople } from '../data';

export function SelectionExample() {
  const data = useMemo(() => makePeople(1_000, 3), []);
  const table = useTable({
    data,
    columns: personColumns,
    getRowId: (r) => r.id,
    enableRowSelection: true,
  });

  const selected = table.getSelectedRows();
  const payroll = selected.reduce((sum, p) => sum + p.salary, 0);

  return (
    <div>
      <div className="toolbar">
        <input
          className="search"
          type="search"
          placeholder="Filter, then “select all” selects only the matches…"
          aria-label="Filter people"
          value={table.state.globalFilter}
          onChange={(e) => table.setGlobalFilter(e.target.value)}
        />
        <span className="muted" aria-live="polite">
          {selected.length} selected · payroll {currency.format(payroll)}
        </span>
        <button
          type="button"
          disabled={selected.length === 0}
          onClick={() => table.setState({ rowSelection: {} })}
        >
          Clear
        </button>
      </div>
      <DataTable table={table} height={420} rowHeight={40} aria-label="People with selection" />
    </div>
  );
}
