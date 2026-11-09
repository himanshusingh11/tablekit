/** A primitive value a column can produce for sorting / filtering / display. */
export type CellValue = string | number | boolean | Date | null | undefined;

export type SortDirection = 'asc' | 'desc';

export interface SortItem {
  id: string;
  desc: boolean;
}
export type SortingState = SortItem[];

export interface ColumnFilter {
  id: string;
  value: string;
}
export type ColumnFiltersState = ColumnFilter[];

/** Map of row id -> selected. Only selected ids are present. */
export type RowSelectionState = Record<string, true>;

/** Map of column id -> width in px (overrides the column's default width). */
export type ColumnSizingState = Record<string, number>;

/** Ids of columns pinned to the left, in order. */
export type ColumnPinningState = string[];

export interface TableState {
  sorting: SortingState;
  columnFilters: ColumnFiltersState;
  globalFilter: string;
  rowSelection: RowSelectionState;
  columnSizing: ColumnSizingState;
  columnPinning: ColumnPinningState;
}

export interface ColumnDef<T> {
  /** Unique, stable column id. */
  id: string;
  /** Header label (string for simple headers; ReactNode is allowed in the React layer). */
  header: unknown;
  /** Reads the cell value from a row. */
  accessor: (row: T) => CellValue;
  /** Enables click-to-sort on this column. */
  sortable?: boolean;
  /** Includes this column in global filtering and allows a per-column filter. */
  filterable?: boolean;
  /** Initial width in px (default 150). */
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  /** Allow drag-resize (default true). */
  resizable?: boolean;
  /** Pin to the left on first render. */
  pinned?: boolean;
  align?: 'left' | 'center' | 'right';
  /** Custom comparator. Return <0, 0, >0 for ascending order. */
  sortFn?: (a: T, b: T) => number;
  /** Custom filter predicate for this column's filter value. */
  filterFn?: (row: T, filterValue: string) => boolean;
  /** Custom cell renderer (typed as unknown here; the React layer narrows it to ReactNode). */
  cell?: (row: T, value: CellValue) => unknown;
}

export const DEFAULT_COLUMN_WIDTH = 150;
export const DEFAULT_MIN_WIDTH = 50;
export const DEFAULT_MAX_WIDTH = 1000;
