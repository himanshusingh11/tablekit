import type { CellValue, ColumnDef, SortingState } from './types';

/**
 * Cycle a column's sort: none -> asc -> desc -> none.
 * With `multi`, other sorted columns are kept (shift+click); otherwise they are replaced.
 */
export function getNextSorting(
  sorting: SortingState,
  columnId: string,
  multi = false,
): SortingState {
  const existing = sorting.find((s) => s.id === columnId);
  let next: { id: string; desc: boolean } | null;
  if (!existing) next = { id: columnId, desc: false };
  else if (!existing.desc) next = { id: columnId, desc: true };
  else next = null;

  if (!multi) return next ? [next] : [];

  if (!existing) return [...sorting, next!];
  return next
    ? sorting.map((s) => (s.id === columnId ? next! : s))
    : sorting.filter((s) => s.id !== columnId);
}

/** Compare two cell values; nullish values always sort last (regardless of direction handled by caller). */
export function compareValues(a: CellValue, b: CellValue): number {
  if (a === b) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  if (typeof a === 'number' && typeof b === 'number') {
    if (Number.isNaN(a)) return Number.isNaN(b) ? 0 : 1;
    if (Number.isNaN(b)) return -1;
    return a - b;
  }
  if (typeof a === 'boolean' && typeof b === 'boolean') return a ? 1 : -1;
  return collator.compare(String(a), String(b));
}

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

/**
 * Stable multi-column sort. Returns the same array instance when nothing is sorted.
 * Nullish values are placed last for both directions.
 */
export function sortRows<T>(
  rows: readonly T[],
  sorting: SortingState,
  columns: readonly ColumnDef<T>[],
): readonly T[] {
  if (sorting.length === 0 || rows.length < 2) return rows;

  const byId = new Map(columns.map((c) => [c.id, c]));
  const sorters = sorting
    .map((s) => ({ col: byId.get(s.id), dir: s.desc ? -1 : 1 }))
    .filter((s): s is { col: ColumnDef<T>; dir: 1 | -1 } => s.col !== undefined);
  if (sorters.length === 0) return rows;

  // Pre-compute accessor values once per row (O(n) accessor calls instead of O(n log n)).
  const values = sorters.map(({ col }) => (col.sortFn ? null : rows.map(col.accessor)));
  const indices = rows.map((_, i) => i);

  indices.sort((ia, ib) => {
    for (let k = 0; k < sorters.length; k++) {
      const { col, dir } = sorters[k]!;
      let result: number;
      if (col.sortFn) {
        result = col.sortFn(rows[ia]!, rows[ib]!) * dir;
      } else {
        const va = values[k]![ia];
        const vb = values[k]![ib];
        // Keep nullish last regardless of direction.
        if (va == null || vb == null) result = compareValues(va, vb);
        else result = compareValues(va, vb) * dir;
      }
      if (result !== 0) return result;
    }
    return ia - ib; // stability
  });

  return indices.map((i) => rows[i]!);
}
