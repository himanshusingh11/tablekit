import type { CellValue, ColumnDef, ColumnFiltersState } from './types';

function valueToSearchString(value: CellValue): string {
  if (value == null) return '';
  if (value instanceof Date) return value.toISOString();
  return String(value).toLowerCase();
}

/** Default text filter: case-insensitive substring match. */
export function defaultFilterFn(value: CellValue, filterValue: string): boolean {
  return valueToSearchString(value).includes(filterValue.toLowerCase());
}

/**
 * Apply per-column filters (AND) and the global filter (matches any filterable column).
 * Returns the same array instance when no filter is active.
 */
export function filterRows<T>(
  rows: readonly T[],
  columns: readonly ColumnDef<T>[],
  columnFilters: ColumnFiltersState,
  globalFilter: string,
): readonly T[] {
  const byId = new Map(columns.map((c) => [c.id, c]));
  const active = columnFilters
    .filter((f) => f.value.trim() !== '')
    .map((f) => ({ col: byId.get(f.id), value: f.value.trim() }))
    .filter((f): f is { col: ColumnDef<T>; value: string } => f.col !== undefined);
  const global = globalFilter.trim();
  const globalCols = global ? columns.filter((c) => c.filterable) : [];

  if (active.length === 0 && globalCols.length === 0) return rows;

  return rows.filter((row) => {
    for (const { col, value } of active) {
      const ok = col.filterFn
        ? col.filterFn(row, value)
        : defaultFilterFn(col.accessor(row), value);
      if (!ok) return false;
    }
    if (globalCols.length > 0) {
      return globalCols.some((col) =>
        col.filterFn ? col.filterFn(row, global) : defaultFilterFn(col.accessor(row), global),
      );
    }
    return true;
  });
}

/** Set (or clear, when value is empty) a single column filter immutably. */
export function setColumnFilter(
  filters: ColumnFiltersState,
  id: string,
  value: string,
): ColumnFiltersState {
  const rest = filters.filter((f) => f.id !== id);
  return value === '' ? rest : [...rest, { id, value }];
}
