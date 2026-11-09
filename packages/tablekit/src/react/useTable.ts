import { useCallback, useMemo, useRef, useState } from 'react';
import {
  filterRows,
  getColumnLayout,
  getInitialPinning,
  getNextSorting,
  getSelectAllStatus,
  selectRange as coreSelectRange,
  setAllSelected,
  setColumnFilter as coreSetColumnFilter,
  sortRows,
  toggleRowSelected as coreToggleRowSelected,
  clampWidth,
  type ColumnFiltersState,
  type ColumnLayout,
  type ColumnPinningState,
  type ColumnSizingState,
  type RowSelectionState,
  type SelectAllStatus,
  type SortDirection,
  type SortingState,
  type TableState,
} from '../core';
import type { ColumnDef } from './types';

export interface UseTableOptions<T> {
  data: readonly T[];
  /** Keep this array referentially stable (define it outside the component or memoize it). */
  columns: readonly ColumnDef<T>[];
  getRowId: (row: T) => string;
  enableRowSelection?: boolean;
  /** Allow shift+click multi-column sorting (default true). */
  enableMultiSort?: boolean;
  /** Sorting is done by the server; rows are rendered in the order given. */
  manualSorting?: boolean;
  /** Filtering is done by the server; rows are rendered as given. */
  manualFiltering?: boolean;
  /** Total row count, for `aria-rowcount` when the server only sends a page. Defaults to rows.length. */
  rowCount?: number;
  /** Starting state for uncontrolled usage. */
  initialState?: Partial<TableState>;
  /** Controlled state. Any key present here overrides internal state. */
  state?: Partial<TableState>;
  onStateChange?: (state: TableState) => void;
  onSortingChange?: (sorting: SortingState) => void;
  onFiltersChange?: (filters: ColumnFiltersState) => void;
  onGlobalFilterChange?: (globalFilter: string) => void;
  onRowSelectionChange?: (selection: RowSelectionState) => void;
  onColumnSizingChange?: (sizing: ColumnSizingState) => void;
  onColumnPinningChange?: (pinning: ColumnPinningState) => void;
}

export type StateUpdater = Partial<TableState> | ((prev: TableState) => TableState);

export interface Table<T> {
  options: UseTableOptions<T>;
  state: TableState;
  columns: readonly ColumnDef<T>[];
  /** Processed rows (filtered + sorted) in display order. */
  rows: readonly T[];
  /** Ids of `rows`, same order. */
  rowIds: readonly string[];
  /** Total row count for ARIA. */
  rowCount: number;
  /** Column order (pinned first), widths and offsets. */
  layout: { columns: ColumnLayout<T>[]; totalWidth: number; pinnedWidth: number };
  setState: (updater: StateUpdater) => void;

  toggleSort: (columnId: string, multi?: boolean) => void;
  setSorting: (sorting: SortingState) => void;
  getSortDirection: (columnId: string) => SortDirection | false;
  /** Position in a multi-sort (0-based) or -1. */
  getSortIndex: (columnId: string) => number;

  setGlobalFilter: (value: string) => void;
  setColumnFilter: (columnId: string, value: string) => void;
  getColumnFilter: (columnId: string) => string;

  isRowSelected: (id: string) => boolean;
  toggleRowSelected: (id: string, value?: boolean) => void;
  /** Select display-order rows between two indices (inclusive). */
  selectRange: (fromIndex: number, toIndex: number, value?: boolean) => void;
  /** Select / deselect all currently filtered rows. Toggles when `value` is omitted. */
  toggleAllRowsSelected: (value?: boolean) => void;
  selectAllStatus: SelectAllStatus;
  selectedRowIds: string[];
  getSelectedRows: () => T[];

  setColumnWidth: (columnId: string, width: number) => void;
  resetColumnWidth: (columnId: string) => void;
  toggleColumnPinned: (columnId: string, value?: boolean) => void;
}

const EMPTY_STATE: TableState = {
  sorting: [],
  columnFilters: [],
  globalFilter: '',
  rowSelection: {},
  columnSizing: {},
  columnPinning: [],
};

export function useTable<T>(options: UseTableOptions<T>): Table<T> {
  const { data, columns, manualSorting, manualFiltering } = options;

  const [internal, setInternal] = useState<TableState>(() => ({
    ...EMPTY_STATE,
    columnPinning: getInitialPinning(columns),
    ...options.initialState,
  }));

  const controlled = options.state;
  const state = useMemo<TableState>(
    () => (controlled ? { ...internal, ...controlled } : internal),
    [internal, controlled],
  );

  // Refs give stable callbacks that always see the latest state/options.
  const stateRef = useRef(state);
  stateRef.current = state;
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const setState = useCallback((updater: StateUpdater) => {
    const prev = stateRef.current;
    const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
    if (next === prev) return;
    stateRef.current = next; // lets several updates in one event compose
    setInternal(next);
    const o = optionsRef.current;
    if (next.sorting !== prev.sorting) o.onSortingChange?.(next.sorting);
    if (next.columnFilters !== prev.columnFilters) o.onFiltersChange?.(next.columnFilters);
    if (next.globalFilter !== prev.globalFilter) o.onGlobalFilterChange?.(next.globalFilter);
    if (next.rowSelection !== prev.rowSelection) o.onRowSelectionChange?.(next.rowSelection);
    if (next.columnSizing !== prev.columnSizing) o.onColumnSizingChange?.(next.columnSizing);
    if (next.columnPinning !== prev.columnPinning) o.onColumnPinningChange?.(next.columnPinning);
    o.onStateChange?.(next);
  }, []);

  // ---- derived rows (memoized; scrolling never re-sorts) ----
  const filtered = useMemo(
    () =>
      manualFiltering ? data : filterRows(data, columns, state.columnFilters, state.globalFilter),
    [data, columns, manualFiltering, state.columnFilters, state.globalFilter],
  );
  const rows = useMemo(
    () => (manualSorting ? filtered : sortRows(filtered, state.sorting, columns)),
    [filtered, columns, manualSorting, state.sorting],
  );
  const rowIds = useMemo(() => {
    const getId = optionsRef.current.getRowId;
    return rows.map((r) => getId(r));
  }, [rows]);

  const layout = useMemo(
    () => getColumnLayout(columns, state.columnSizing, state.columnPinning),
    [columns, state.columnSizing, state.columnPinning],
  );

  const selectAllStatus = useMemo(
    () => getSelectAllStatus(state.rowSelection, rowIds),
    [state.rowSelection, rowIds],
  );
  const selectedRowIds = useMemo(() => Object.keys(state.rowSelection), [state.rowSelection]);

  const rowIdsRef = useRef(rowIds);
  rowIdsRef.current = rowIds;

  // ---- actions (stable) ----
  const actions = useMemo(() => {
    const update = <K extends keyof TableState>(key: K, fn: (v: TableState[K]) => TableState[K]) =>
      setState((prev) => {
        const v = fn(prev[key]);
        return v === prev[key] ? prev : { ...prev, [key]: v };
      });
    const findCol = (id: string) => optionsRef.current.columns.find((c) => c.id === id);

    return {
      setState,
      toggleSort: (columnId: string, multi = false) =>
        update('sorting', (s) =>
          getNextSorting(s, columnId, multi && optionsRef.current.enableMultiSort !== false),
        ),
      setSorting: (sorting: SortingState) => update('sorting', () => sorting),
      setGlobalFilter: (value: string) => update('globalFilter', () => value),
      setColumnFilter: (columnId: string, value: string) =>
        update('columnFilters', (f) => coreSetColumnFilter(f, columnId, value)),
      toggleRowSelected: (id: string, value?: boolean) =>
        update('rowSelection', (s) => coreToggleRowSelected(s, id, value)),
      selectRange: (fromIndex: number, toIndex: number, value = true) =>
        update('rowSelection', (s) =>
          coreSelectRange(s, rowIdsRef.current, fromIndex, toIndex, value),
        ),
      toggleAllRowsSelected: (value?: boolean) =>
        update('rowSelection', (s) => {
          const ids = rowIdsRef.current;
          const v = value ?? getSelectAllStatus(s, ids) !== 'all';
          return setAllSelected(s, ids, v);
        }),
      setColumnWidth: (columnId: string, width: number) =>
        update('columnSizing', (s) => {
          const col = findCol(columnId);
          if (!col) return s;
          const w = clampWidth(col, width);
          return s[columnId] === w ? s : { ...s, [columnId]: w };
        }),
      resetColumnWidth: (columnId: string) =>
        update('columnSizing', (s) => {
          if (!(columnId in s)) return s;
          const next = { ...s };
          delete next[columnId];
          return next;
        }),
      toggleColumnPinned: (columnId: string, value?: boolean) =>
        update('columnPinning', (p) => {
          const pinned = p.includes(columnId);
          const v = value ?? !pinned;
          if (v === pinned) return p;
          return v ? [...p, columnId] : p.filter((id) => id !== columnId);
        }),
    };
  }, [setState]);

  return {
    ...actions,
    options,
    state,
    columns,
    rows,
    rowIds,
    rowCount: options.rowCount ?? rows.length,
    layout,
    getSortDirection: (id) => {
      const s = state.sorting.find((x) => x.id === id);
      return s ? (s.desc ? 'desc' : 'asc') : false;
    },
    getSortIndex: (id) => state.sorting.findIndex((x) => x.id === id),
    getColumnFilter: (id) => state.columnFilters.find((f) => f.id === id)?.value ?? '',
    isRowSelected: (id) => !!state.rowSelection[id],
    selectAllStatus,
    selectedRowIds,
    getSelectedRows: () => {
      const getId = optionsRef.current.getRowId;
      return data.filter((r) => state.rowSelection[getId(r)]);
    },
  };
}
