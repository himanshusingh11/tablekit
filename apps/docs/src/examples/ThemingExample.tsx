import { useMemo, useState, type CSSProperties } from 'react';
import { DataTable, useTable } from 'react-tablekit';
import 'react-tablekit/styles.css';
import { personColumns } from '../columns';
import { makePeople } from '../data';

// Every colour, spacing and radius is a CSS variable. Set them on the table (or any parent).
const themes: Record<string, CSSProperties> = {
  Default: {},
  Midnight: {
    '--tk-bg': '#0d1117',
    '--tk-fg': '#e6edf3',
    '--tk-muted': '#8b949e',
    '--tk-border': '#30363d',
    '--tk-header-bg': '#161b22',
    '--tk-header-fg': '#e6edf3',
    '--tk-row-odd-bg': '#10151c',
    '--tk-row-hover-bg': '#1c2330',
    '--tk-row-selected-bg': '#1f3a5f',
    '--tk-focus': '#58a6ff',
    '--tk-accent': '#58a6ff',
  } as CSSProperties,
  Compact: {
    '--tk-font-size': '12px',
    '--tk-cell-padding': '0 8px',
    '--tk-radius': '2px',
    '--tk-header-bg': '#eef1f4',
  } as CSSProperties,
  Sunset: {
    '--tk-bg': '#fffaf5',
    '--tk-border': '#f1d9c4',
    '--tk-header-bg': '#ffeede',
    '--tk-header-fg': '#7a3410',
    '--tk-row-odd-bg': '#fff4ea',
    '--tk-row-hover-bg': '#ffe7d1',
    '--tk-row-selected-bg': '#ffd8b5',
    '--tk-accent': '#d9480f',
    '--tk-focus': '#d9480f',
    '--tk-radius': '14px',
  } as CSSProperties,
};

export function ThemingExample() {
  const data = useMemo(() => makePeople(500, 9), []);
  const table = useTable({
    data,
    columns: personColumns,
    getRowId: (r) => r.id,
    enableRowSelection: true,
  });
  const [theme, setTheme] = useState('Midnight');

  return (
    <div>
      <div className="toolbar" role="radiogroup" aria-label="Theme">
        {Object.keys(themes).map((name) => (
          <button
            key={name}
            type="button"
            role="radio"
            aria-checked={theme === name}
            className={theme === name ? 'chip chip-on' : 'chip'}
            onClick={() => setTheme(name)}
          >
            {name}
          </button>
        ))}
      </div>
      <DataTable
        table={table}
        height={360}
        rowHeight={theme === 'Compact' ? 28 : 40}
        style={themes[theme]}
        aria-label="Themed table"
      />
    </div>
  );
}
