import {
  DEFAULT_COLUMN_WIDTH,
  DEFAULT_MAX_WIDTH,
  DEFAULT_MIN_WIDTH,
  type ColumnDef,
  type ColumnPinningState,
  type ColumnSizingState,
} from './types';

export function clampWidth<T>(col: ColumnDef<T>, width: number): number {
  const min = col.minWidth ?? DEFAULT_MIN_WIDTH;
  const max = col.maxWidth ?? DEFAULT_MAX_WIDTH;
  return Math.round(Math.min(max, Math.max(min, width)));
}

export function getColumnWidth<T>(col: ColumnDef<T>, sizing: ColumnSizingState): number {
  return clampWidth(col, sizing[col.id] ?? col.width ?? DEFAULT_COLUMN_WIDTH);
}

export function getInitialPinning<T>(columns: readonly ColumnDef<T>[]): ColumnPinningState {
  return columns.filter((c) => c.pinned).map((c) => c.id);
}

export interface ColumnLayout<T> {
  column: ColumnDef<T>;
  /** Index in the rendered (pinned-first) order. */
  index: number;
  width: number;
  /** Left offset in px from the start of the row. */
  left: number;
  pinned: boolean;
  /** True for the last pinned column (useful for a divider shadow). */
  isLastPinned: boolean;
}

/**
 * Order columns with pinned ones first (in pinning order) and compute widths/offsets.
 * Offsets are what sticky pinned cells use as their `left`.
 */
export function getColumnLayout<T>(
  columns: readonly ColumnDef<T>[],
  sizing: ColumnSizingState,
  pinning: ColumnPinningState,
): { columns: ColumnLayout<T>[]; totalWidth: number; pinnedWidth: number } {
  const byId = new Map(columns.map((c) => [c.id, c]));
  const pinnedCols = pinning.map((id) => byId.get(id)).filter((c): c is ColumnDef<T> => !!c);
  const pinnedSet = new Set(pinnedCols.map((c) => c.id));
  const ordered = [...pinnedCols, ...columns.filter((c) => !pinnedSet.has(c.id))];

  let left = 0;
  let pinnedWidth = 0;
  const layout = ordered.map((column, index) => {
    const width = getColumnWidth(column, sizing);
    const pinned = pinnedSet.has(column.id);
    const item: ColumnLayout<T> = {
      column,
      index,
      width,
      left,
      pinned,
      isLastPinned: pinned && index === pinnedCols.length - 1,
    };
    left += width;
    if (pinned) pinnedWidth += width;
    return item;
  });
  return { columns: layout, totalWidth: left, pinnedWidth };
}
