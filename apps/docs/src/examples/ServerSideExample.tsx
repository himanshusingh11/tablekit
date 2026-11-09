import { useEffect, useState } from 'react';
import {
  DataTable,
  filterRows,
  sortRows,
  useTable,
  type ColumnFiltersState,
  type SortingState,
} from 'react-tablekit';
import 'react-tablekit/styles.css';
import { personColumns } from '../columns';
import { makePeople, type Person } from '../data';

// --- A fake API: in a real app this is fetch('/api/people?sort=...&q=...') ---
const DB = makePeople(5_000, 7);
const PAGE_SIZE = 50;

async function fetchPeople(params: {
  sorting: SortingState;
  filters: ColumnFiltersState;
  q: string;
  page: number;
}) {
  await new Promise((r) => setTimeout(r, 400)); // network latency
  const filtered = filterRows(DB, personColumns, params.filters, params.q);
  const sorted = sortRows(filtered, params.sorting, personColumns);
  const start = params.page * PAGE_SIZE;
  return { rows: sorted.slice(start, start + PAGE_SIZE), total: sorted.length };
}

export function ServerSideExample() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [filters, setFilters] = useState<ColumnFiltersState>([]);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(0);
  const [result, setResult] = useState<{ rows: Person[]; total: number }>({ rows: [], total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchPeople({ sorting, filters, q, page }).then((res) => {
      if (cancelled) return;
      setResult(res);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [sorting, filters, q, page]);

  const table = useTable({
    data: result.rows,
    columns: personColumns,
    getRowId: (r) => r.id,
    manualSorting: true,
    manualFiltering: true,
    state: { sorting, columnFilters: filters, globalFilter: q },
    onSortingChange: (s) => {
      setSorting(s);
      setPage(0);
    },
    onFiltersChange: (f) => {
      setFilters(f);
      setPage(0);
    },
    onGlobalFilterChange: (value) => {
      setQ(value);
      setPage(0);
    },
  });

  const pages = Math.max(1, Math.ceil(result.total / PAGE_SIZE));

  return (
    <div>
      <div className="toolbar">
        <input
          className="search"
          type="search"
          placeholder="Search (server-side)…"
          aria-label="Search people on the server"
          value={q}
          onChange={(e) => table.setGlobalFilter(e.target.value)}
        />
        <span className="muted">{result.total.toLocaleString()} matches</span>
      </div>
      <DataTable
        table={table}
        height={420}
        rowHeight={36}
        loading={loading}
        aria-label="People (server-side)"
      />
      <div className="pager">
        <button
          type="button"
          disabled={page === 0 || loading}
          onClick={() => setPage((p) => p - 1)}
        >
          ← Prev
        </button>
        <span>
          Page {page + 1} of {pages}
        </span>
        <button
          type="button"
          disabled={page + 1 >= pages || loading}
          onClick={() => setPage((p) => p + 1)}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
