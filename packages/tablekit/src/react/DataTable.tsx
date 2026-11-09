import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import type { CellValue } from '../core/types';
import { getScrollTopForIndex } from '../core/virtual';
import type { Table } from './useTable';
import type { ColumnDef } from './types';
import { useVirtualRows } from './useVirtualRows';

export interface DataTableProps<T> {
  table: Table<T>;
  /** Height of the table viewport in px (default 400). The table also adapts if CSS resizes it. */
  height?: number;
  /** Fixed row height in px (default 40). */
  rowHeight?: number;
  /** Header height in px (defaults to rowHeight). */
  headerHeight?: number;
  /** Rows rendered above/below the visible window (default 5). */
  overscan?: number;
  loading?: boolean;
  /** Content shown when there are no rows. */
  emptyState?: ReactNode;
  /** Content of the loading overlay (default "Loading…"). */
  loadingState?: ReactNode;
  className?: string;
  style?: CSSProperties;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  /** Called on row click, and on Enter while a body cell is focused. */
  onRowClick?: (row: T, index: number) => void;
  getRowClassName?: (row: T, index: number) => string | undefined;
}

interface DisplayColumn<T> {
  key: string;
  kind: 'select' | 'data';
  column?: ColumnDef<T>;
  width: number;
  left: number;
  pinned: boolean;
  isLastPinned: boolean;
}

const SELECT_COLUMN_WIDTH = 44;
const RESIZE_STEP = 10;

function formatValue(value: CellValue): ReactNode {
  if (value == null) return '';
  if (value instanceof Date) return value.toLocaleDateString();
  return String(value);
}

function cellClassName<T>(dc: DisplayColumn<T>, base: string): string {
  let cls = base;
  if (dc.pinned) cls += ' tk-pinned';
  if (dc.isLastPinned) cls += ' tk-last-pinned';
  if (dc.kind === 'select') cls += ' tk-select-cell';
  const align = dc.column?.align;
  if (align && align !== 'left') cls += ` tk-align-${align}`;
  return cls;
}

function cellStyle<T>(dc: DisplayColumn<T>): CSSProperties {
  return dc.pinned ? { width: dc.width, left: dc.left } : { width: dc.width };
}

// ---------------------------------------------------------------------------
// Row (memoized: only re-renders when its own data, selection or focus changes)
// ---------------------------------------------------------------------------

interface RowProps<T> {
  row: T;
  index: number;
  columns: DisplayColumn<T>[];
  rowHeight: number;
  totalWidth: number;
  selectable: boolean;
  selected: boolean;
  /** Column index holding the grid's single tab stop, or -1. */
  tabbableCol: number;
  className?: string;
  onSelect: (index: number, shift: boolean) => void;
  onRowClick?: (row: T, index: number) => void;
}

function RowImpl<T>({
  row,
  index,
  columns,
  rowHeight,
  totalWidth,
  selectable,
  selected,
  tabbableCol,
  className,
  onSelect,
  onRowClick,
}: RowProps<T>) {
  const gridRow = index + 1;
  return (
    <div
      role="row"
      aria-rowindex={index + 2}
      aria-selected={selectable ? selected : undefined}
      className={`tk-row${selected ? ' tk-row-selected' : ''}${index % 2 ? ' tk-row-odd' : ''}${className ? ` ${className}` : ''}`}
      style={{
        height: rowHeight,
        width: totalWidth,
        transform: `translateY(${index * rowHeight}px)`,
      }}
      onClick={onRowClick ? () => onRowClick(row, index) : undefined}
    >
      {columns.map((dc, c) => {
        const tabIndex = tabbableCol === c ? 0 : -1;
        if (dc.kind === 'select') {
          return (
            <div
              key={dc.key}
              role="gridcell"
              aria-colindex={c + 1}
              tabIndex={tabIndex}
              data-tk-cell={`${gridRow}:${c}`}
              className={cellClassName(dc, 'tk-cell')}
              style={cellStyle(dc)}
            >
              <input
                type="checkbox"
                className="tk-checkbox"
                tabIndex={-1}
                aria-label={`Select row ${index + 1}`}
                checked={selected}
                onMouseDown={(e) => e.shiftKey && e.preventDefault()}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => onSelect(index, (e.nativeEvent as MouseEvent).shiftKey === true)}
              />
            </div>
          );
        }
        const col = dc.column!;
        const value = col.accessor(row);
        return (
          <div
            key={dc.key}
            role="gridcell"
            aria-colindex={c + 1}
            tabIndex={tabIndex}
            data-tk-cell={`${gridRow}:${c}`}
            className={cellClassName(dc, 'tk-cell')}
            style={cellStyle(dc)}
          >
            {col.cell ? col.cell(row, value) : formatValue(value)}
          </div>
        );
      })}
    </div>
  );
}

const Row = memo(RowImpl) as typeof RowImpl;

// ---------------------------------------------------------------------------
// DataTable
// ---------------------------------------------------------------------------

export function DataTable<T>({
  table,
  height = 400,
  rowHeight = 40,
  headerHeight = rowHeight,
  overscan = 5,
  loading = false,
  emptyState,
  loadingState,
  className,
  style,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  onRowClick,
  getRowClassName,
}: DataTableProps<T>) {
  const { rows, rowIds, layout, state } = table;
  const selectable = !!table.options.enableRowSelection;
  const scrollRef = useRef<HTMLDivElement>(null);

  // ---- columns (selection column + data columns, pinned first) ----
  const offset = selectable ? SELECT_COLUMN_WIDTH : 0;
  const columns = useMemo<DisplayColumn<T>[]>(() => {
    const cols: DisplayColumn<T>[] = [];
    if (selectable) {
      cols.push({
        key: '__select',
        kind: 'select',
        width: SELECT_COLUMN_WIDTH,
        left: 0,
        pinned: true,
        isLastPinned: layout.pinnedWidth === 0,
      });
    }
    for (const c of layout.columns) {
      cols.push({
        key: c.column.id,
        kind: 'data',
        column: c.column as ColumnDef<T>,
        width: c.width,
        left: c.left + offset,
        pinned: c.pinned,
        isLastPinned: c.isLastPinned,
      });
    }
    return cols;
  }, [layout, selectable, offset]);
  const totalWidth = layout.totalWidth + offset;
  const pinnedWidth = layout.pinnedWidth + offset;

  // ---- virtualization ----
  const virtual = useVirtualRows({
    scrollRef,
    rowCount: rows.length,
    rowHeight,
    height,
    headerHeight,
    overscan,
  });

  // ---- roving focus: active cell in grid coordinates (row 0 = header) ----
  const [active, setActive] = useState({ row: 0, col: 0 });
  const activeRow = Math.min(active.row, rows.length);
  const activeCol = Math.min(active.col, columns.length - 1);
  const activeRef = useRef({ row: activeRow, col: activeCol });
  activeRef.current = { row: activeRow, col: activeCol };
  const focusPending = useRef(false);

  // The single tab stop stays on the active cell while it is rendered; if it was
  // virtualized away (mouse scroll), fall back to the header cell of the same column.
  const activeRendered =
    activeRow === 0 || (activeRow - 1 >= virtual.start && activeRow - 1 < virtual.end);
  const tabRow = activeRendered ? activeRow : 0;

  useEffect(() => {
    if (!focusPending.current) return;
    const el = scrollRef.current?.querySelector<HTMLElement>(
      `[data-tk-cell="${activeRow}:${activeCol}"]`,
    );
    if (el) {
      focusPending.current = false;
      el.focus({ preventScroll: true });
    }
  });

  const scrollIntoView = useCallback(
    (row: number, col: number) => {
      const el = scrollRef.current;
      if (!el) return;
      if (row > 0) {
        const top = getScrollTopForIndex(
          row - 1,
          el.scrollTop,
          virtual.bodyHeight + headerHeight,
          rowHeight,
          headerHeight,
        );
        if (top !== null) el.scrollTop = top;
      }
      const dc = columns[col];
      if (dc && !dc.pinned && el.clientWidth > 0) {
        const visibleLeft = el.scrollLeft + pinnedWidth;
        const visibleRight = el.scrollLeft + el.clientWidth;
        if (dc.left < visibleLeft) el.scrollLeft = dc.left - pinnedWidth;
        else if (dc.left + dc.width > visibleRight)
          el.scrollLeft = dc.left + dc.width - el.clientWidth;
      }
      virtual.sync();
    },
    [columns, pinnedWidth, rowHeight, headerHeight, virtual],
  );

  const moveTo = useCallback(
    (row: number, col: number) => {
      focusPending.current = true;
      setActive({ row, col });
      scrollIntoView(row, col);
    },
    [scrollIntoView],
  );

  // ---- selection ----
  const anchorRef = useRef<number | null>(null);
  const tableRef = useRef(table);
  tableRef.current = table;

  const onSelect = useCallback((index: number, shift: boolean) => {
    const t = tableRef.current;
    const anchor = anchorRef.current;
    if (shift && anchor !== null && anchor < t.rowIds.length) {
      const anchorSelected = t.isRowSelected(t.rowIds[anchor]!);
      t.selectRange(anchor, index, anchorSelected);
    } else {
      t.toggleRowSelected(t.rowIds[index]!);
      anchorRef.current = index;
    }
  }, []);

  // ---- column resize ----
  const resizingRef = useRef(false);
  const startResize = (e: ReactPointerEvent<HTMLDivElement>, columnId: string, width: number) => {
    e.preventDefault();
    e.stopPropagation();
    const handle = e.currentTarget;
    const startX = e.clientX;
    resizingRef.current = true;
    handle.setPointerCapture?.(e.pointerId);
    const move = (ev: PointerEvent) => table.setColumnWidth(columnId, width + ev.clientX - startX);
    const end = () => {
      handle.removeEventListener('pointermove', move);
      handle.removeEventListener('pointerup', end);
      handle.removeEventListener('pointercancel', end);
      // Let the click that follows pointerup be ignored by the header's sort handler.
      setTimeout(() => (resizingRef.current = false), 0);
    };
    handle.addEventListener('pointermove', move);
    handle.addEventListener('pointerup', end);
    handle.addEventListener('pointercancel', end);
  };

  // ---- keyboard (ARIA grid pattern) ----
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('input:not([type=checkbox]),textarea,select,[contenteditable="true"]'))
      return;

    const lastRow = rows.length;
    const lastCol = columns.length - 1;
    let { row, col } = activeRef.current;
    const ctrl = e.ctrlKey || e.metaKey;
    const page = Math.max(1, Math.floor(virtual.bodyHeight / rowHeight));
    const dc = columns[col];

    switch (e.key) {
      case 'ArrowDown':
        row = Math.min(lastRow, row + 1);
        break;
      case 'ArrowUp':
        row = Math.max(0, row - 1);
        break;
      case 'ArrowRight':
      case 'ArrowLeft': {
        const dir = e.key === 'ArrowRight' ? 1 : -1;
        if (e.altKey && row === 0 && dc?.column && dc.column.resizable !== false) {
          e.preventDefault();
          table.setColumnWidth(dc.column.id, dc.width + dir * RESIZE_STEP);
          return;
        }
        col = Math.min(lastCol, Math.max(0, col + dir));
        break;
      }
      case 'Home':
        col = 0;
        if (ctrl) row = lastRow > 0 ? 1 : 0;
        break;
      case 'End':
        col = lastCol;
        if (ctrl) row = lastRow;
        break;
      case 'PageDown':
        row = Math.min(lastRow, row + page);
        break;
      case 'PageUp':
        row = Math.max(row > 0 && lastRow > 0 ? 1 : 0, row - page);
        break;
      case ' ':
      case 'Spacebar':
      case 'Enter': {
        e.preventDefault();
        const isEnter = e.key === 'Enter';
        if (row === 0) {
          if (dc?.kind === 'select') table.toggleAllRowsSelected();
          else if (isEnter && dc?.column?.sortable) table.toggleSort(dc.column.id, e.shiftKey);
        } else if (!isEnter && selectable) {
          onSelect(row - 1, e.shiftKey);
        } else if (isEnter && onRowClick) {
          onRowClick(rows[row - 1]!, row - 1);
        }
        return;
      }
      case 'a':
      case 'A':
        if (ctrl && selectable) {
          e.preventDefault();
          table.toggleAllRowsSelected(true);
        }
        return;
      default:
        return;
    }
    e.preventDefault();
    moveTo(row, col);
  };

  // Clicking (or tabbing into) a cell makes it the active cell.
  const onFocus = (e: FocusEvent<HTMLDivElement>) => {
    const cell = (e.target as HTMLElement).closest<HTMLElement>('[data-tk-cell]');
    if (!cell) return;
    const [r, c] = cell.dataset.tkCell!.split(':').map(Number) as [number, number];
    const cur = activeRef.current;
    if (r !== cur.row || c !== cur.col) setActive({ row: r, col: c });
  };

  // ---- render ----
  const sortCount = state.sorting.length;
  const header = (
    <div role="rowgroup" className="tk-head">
      <div
        role="row"
        aria-rowindex={1}
        className="tk-header-row"
        style={{ height: headerHeight, width: totalWidth }}
      >
        {columns.map((dc, c) => {
          const tabIndex = tabRow === 0 && activeCol === c ? 0 : -1;
          if (dc.kind === 'select') {
            const status = table.selectAllStatus;
            return (
              <div
                key={dc.key}
                role="columnheader"
                aria-colindex={c + 1}
                tabIndex={tabIndex}
                data-tk-cell={`0:${c}`}
                className={cellClassName(dc, 'tk-header-cell')}
                style={cellStyle(dc)}
              >
                <input
                  type="checkbox"
                  className="tk-checkbox"
                  tabIndex={-1}
                  aria-label="Select all rows"
                  checked={status === 'all'}
                  ref={(el) => {
                    if (el) el.indeterminate = status === 'some';
                  }}
                  onChange={() => table.toggleAllRowsSelected()}
                />
              </div>
            );
          }
          const col = dc.column!;
          const dir = col.sortable ? table.getSortDirection(col.id) : false;
          const sortIndex = dir ? table.getSortIndex(col.id) : -1;
          return (
            <div
              key={dc.key}
              role="columnheader"
              aria-colindex={c + 1}
              aria-sort={dir ? (dir === 'asc' ? 'ascending' : 'descending') : undefined}
              tabIndex={tabIndex}
              data-tk-cell={`0:${c}`}
              className={cellClassName(dc, `tk-header-cell${col.sortable ? ' tk-sortable' : ''}`)}
              style={cellStyle(dc)}
              onClick={
                col.sortable
                  ? (e) => {
                      if (!resizingRef.current) table.toggleSort(col.id, e.shiftKey);
                    }
                  : undefined
              }
            >
              <span className="tk-header-label">{col.header}</span>
              {col.sortable && (
                <span className="tk-sort-indicator" data-dir={dir || 'none'} aria-hidden="true">
                  {dir === 'asc' ? '▲' : dir === 'desc' ? '▼' : '↕'}
                  {sortCount > 1 && sortIndex >= 0 ? <sup>{sortIndex + 1}</sup> : null}
                </span>
              )}
              {col.resizable !== false && (
                <div
                  className="tk-resizer"
                  aria-hidden="true"
                  onPointerDown={(e) => startResize(e, col.id, dc.width)}
                  onClick={(e) => e.stopPropagation()}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    table.resetColumnWidth(col.id);
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const bodyRows: ReactNode[] = [];
  for (let i = virtual.start; i < virtual.end; i++) {
    const row = rows[i]!;
    const id = rowIds[i]!;
    bodyRows.push(
      <Row<T>
        key={id}
        row={row}
        index={i}
        columns={columns}
        rowHeight={rowHeight}
        totalWidth={totalWidth}
        selectable={selectable}
        selected={!!state.rowSelection[id]}
        tabbableCol={tabRow === i + 1 ? activeCol : -1}
        className={getRowClassName?.(row, i)}
        onSelect={onSelect}
        onRowClick={onRowClick}
      />,
    );
  }

  const isEmpty = rows.length === 0 && !loading;

  return (
    <div className={`tk-root${className ? ` ${className}` : ''}`} style={{ height, ...style }}>
      <div
        ref={scrollRef}
        className="tk-scroller"
        role="grid"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-rowcount={table.rowCount + 1 + (isEmpty ? 1 : 0)}
        aria-colcount={columns.length}
        aria-multiselectable={selectable || undefined}
        aria-busy={loading || undefined}
        onKeyDown={onKeyDown}
        onFocus={onFocus}
      >
        {header}
        <div
          role="rowgroup"
          className="tk-body"
          style={{ height: isEmpty ? undefined : virtual.totalHeight, width: totalWidth }}
        >
          {isEmpty ? (
            <div role="row" aria-rowindex={2} className="tk-empty-row">
              <div role="gridcell" aria-colspan={columns.length} className="tk-empty">
                {emptyState ?? 'No rows'}
              </div>
            </div>
          ) : (
            bodyRows
          )}
        </div>
      </div>
      {loading && (
        <div className="tk-loading" role="status">
          {loadingState ?? 'Loading…'}
        </div>
      )}
    </div>
  );
}
