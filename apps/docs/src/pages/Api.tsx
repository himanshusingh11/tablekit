import { Code } from '../components/Code';

const rows = (items: [string, string, string][]) => (
  <table className="api">
    <thead>
      <tr>
        <th>Name</th>
        <th>Type</th>
        <th>Description</th>
      </tr>
    </thead>
    <tbody>
      {items.map(([n, t, d]) => (
        <tr key={n}>
          <td>
            <code>{n}</code>
          </td>
          <td>
            <code>{t}</code>
          </td>
          <td>{d}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

export function Api() {
  return (
    <div>
      <h1>API reference</h1>

      <h2 id="columndef">ColumnDef&lt;T&gt;</h2>
      {rows([
        ['id', 'string', 'Unique, stable column id.'],
        ['header', 'ReactNode', 'Header content.'],
        [
          'accessor',
          '(row: T) => CellValue',
          'Reads the value used for display, sorting and filtering.',
        ],
        ['cell?', '(row: T, value) => ReactNode', 'Custom cell renderer.'],
        ['sortable?', 'boolean', 'Click header (or Enter) to sort.'],
        ['filterable?', 'boolean', 'Included in the global filter.'],
        ['sortFn?', '(a: T, b: T) => number', 'Custom ascending comparator.'],
        ['filterFn?', '(row: T, value: string) => boolean', 'Custom filter predicate.'],
        ['width? / minWidth? / maxWidth?', 'number', 'Default 150 / 50 / 1000 px.'],
        ['resizable?', 'boolean', 'Drag handle on header edge. Default true.'],
        ['pinned?', 'boolean', 'Pin to the left initially.'],
        ['align?', "'left' | 'center' | 'right'", 'Cell alignment.'],
      ])}

      <h2 id="usetable">useTable(options)</h2>
      {rows([
        ['data', 'readonly T[]', 'Rows.'],
        [
          'columns',
          'readonly ColumnDef<T>[]',
          'Keep referentially stable (module scope or useMemo).',
        ],
        [
          'getRowId',
          '(row: T) => string',
          'Stable id per row (used for selection and React keys).',
        ],
        ['enableRowSelection?', 'boolean', 'Adds a checkbox column.'],
        ['enableMultiSort?', 'boolean', 'Shift+click multi-sort. Default true.'],
        [
          'manualSorting? / manualFiltering?',
          'boolean',
          'Server does the work; rows render as given.',
        ],
        ['rowCount?', 'number', 'Total rows for aria-rowcount in server mode.'],
        ['initialState?', 'Partial<TableState>', 'Starting state (uncontrolled).'],
        [
          'state?',
          'Partial<TableState>',
          'Controlled state; present keys override internal state.',
        ],
        ['onStateChange?', '(state: TableState) => void', 'Any state change.'],
        ['onSortingChange?', '(sorting: SortingState) => void', ''],
        ['onFiltersChange?', '(filters: ColumnFiltersState) => void', 'Column filters.'],
        ['onGlobalFilterChange?', '(value: string) => void', ''],
        ['onRowSelectionChange?', '(selection: RowSelectionState) => void', ''],
        ['onColumnSizingChange? / onColumnPinningChange?', '…', ''],
      ])}
      <p>
        Returns a <code>Table&lt;T&gt;</code>:
      </p>
      <Code>{`
table.rows                 // filtered + sorted rows (display order)
table.rowIds               // ids in display order
table.state                // { sorting, columnFilters, globalFilter, rowSelection, columnSizing, columnPinning }

table.toggleSort(id, multi?)       table.setSorting(sorting)
table.getSortDirection(id)         // 'asc' | 'desc' | false
table.setGlobalFilter(value)       table.setColumnFilter(id, value)
table.toggleRowSelected(id, v?)    table.selectRange(from, to, v?)
table.toggleAllRowsSelected(v?)    // all *filtered* rows
table.selectAllStatus              // 'none' | 'some' | 'all'
table.getSelectedRows()
table.setColumnWidth(id, px)       table.resetColumnWidth(id)
table.toggleColumnPinned(id, v?)
table.setState(partial | updater)
`}</Code>

      <h2 id="datatable">&lt;DataTable /&gt;</h2>
      {rows([
        ['table', 'Table<T>', 'Result of useTable.'],
        ['height?', 'number', 'Viewport height in px. Default 400.'],
        ['rowHeight?', 'number', 'Fixed row height. Default 40.'],
        ['headerHeight?', 'number', 'Defaults to rowHeight.'],
        ['overscan?', 'number', 'Extra rows rendered above/below. Default 5.'],
        ['loading?', 'boolean', 'Shows an overlay and sets aria-busy.'],
        ['emptyState? / loadingState?', 'ReactNode', 'Custom empty / loading content.'],
        ['aria-label? / aria-labelledby?', 'string', 'Name the grid (recommended).'],
        ['onRowClick?', '(row: T, index: number) => void', 'Row click, or Enter on a body cell.'],
        ['getRowClassName?', '(row: T, index: number) => string', ''],
        ['className? / style?', '', 'Applied to the root; set CSS variables via style.'],
      ])}

      <h2 id="core">react-tablekit/core</h2>
      <p>
        The pure, framework-agnostic logic (no React import), handy on a server or in tests:{' '}
        <code>sortRows</code>, <code>filterRows</code>, <code>getNextSorting</code>,{' '}
        <code>selectRange</code>, <code>getColumnLayout</code>, <code>getVirtualRange</code>, and
        more.
      </p>
      <Code>{`import { sortRows, filterRows } from 'react-tablekit/core';`}</Code>

      <h2 id="css">CSS variables</h2>
      <Code lang="css">{`
.tk-root {
  --tk-bg; --tk-fg; --tk-muted; --tk-border;
  --tk-header-bg; --tk-header-fg;
  --tk-row-odd-bg; --tk-row-hover-bg; --tk-row-selected-bg;
  --tk-focus; --tk-accent;
  --tk-font; --tk-font-size; --tk-cell-padding; --tk-radius; --tk-pinned-shadow;
}
`}</Code>
    </div>
  );
}
