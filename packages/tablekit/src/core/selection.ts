import type { RowSelectionState } from './types';

export function toggleRowSelected(
  selection: RowSelectionState,
  id: string,
  value?: boolean,
): RowSelectionState {
  const selected = value ?? !selection[id];
  if (selected === !!selection[id]) return selection;
  const next = { ...selection };
  if (selected) next[id] = true;
  else delete next[id];
  return next;
}

/**
 * Select (or deselect) every id between `fromIndex` and `toIndex` (inclusive) of `orderedIds`.
 * Used for shift-click range selection over the currently visible (sorted + filtered) rows.
 */
export function selectRange(
  selection: RowSelectionState,
  orderedIds: readonly string[],
  fromIndex: number,
  toIndex: number,
  value = true,
): RowSelectionState {
  const start = Math.max(0, Math.min(fromIndex, toIndex));
  const end = Math.min(orderedIds.length - 1, Math.max(fromIndex, toIndex));
  const next = { ...selection };
  for (let i = start; i <= end; i++) {
    const id = orderedIds[i]!;
    if (value) next[id] = true;
    else delete next[id];
  }
  return next;
}

/** Select or deselect all of `ids` (e.g. all filtered rows), leaving other selections untouched. */
export function setAllSelected(
  selection: RowSelectionState,
  ids: readonly string[],
  value: boolean,
): RowSelectionState {
  const next = { ...selection };
  for (const id of ids) {
    if (value) next[id] = true;
    else delete next[id];
  }
  return next;
}

export type SelectAllStatus = 'none' | 'some' | 'all';

export function getSelectAllStatus(
  selection: RowSelectionState,
  ids: readonly string[],
): SelectAllStatus {
  if (ids.length === 0) return 'none';
  let count = 0;
  for (const id of ids) if (selection[id]) count++;
  if (count === 0) return 'none';
  return count === ids.length ? 'all' : 'some';
}
