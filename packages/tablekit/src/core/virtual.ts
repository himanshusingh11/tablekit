export interface VirtualRange {
  /** First rendered row index (inclusive). */
  start: number;
  /** Last rendered row index (exclusive). */
  end: number;
  /** translateY offset in px for the first rendered row. */
  offset: number;
  /** Total scrollable height of all rows in px. */
  totalHeight: number;
}

/**
 * Fixed-row-height windowing math.
 * Visible rows are those intersecting [scrollTop, scrollTop + viewportHeight);
 * `overscan` extra rows are rendered on both sides to avoid blank flashes while scrolling.
 */
export function getVirtualRange(
  scrollTop: number,
  viewportHeight: number,
  rowHeight: number,
  rowCount: number,
  overscan = 5,
): VirtualRange {
  const totalHeight = rowCount * rowHeight;
  if (rowCount === 0 || rowHeight <= 0) return { start: 0, end: 0, offset: 0, totalHeight };

  const maxScroll = Math.max(0, totalHeight - viewportHeight);
  const top = Math.min(Math.max(0, scrollTop), maxScroll);
  const firstVisible = Math.floor(top / rowHeight);
  const lastVisible = Math.ceil((top + Math.max(0, viewportHeight)) / rowHeight);

  const start = Math.max(0, firstVisible - overscan);
  const end = Math.min(rowCount, Math.max(lastVisible, firstVisible + 1) + overscan);
  return { start, end, offset: start * rowHeight, totalHeight };
}

/**
 * Return the scrollTop needed to bring `index` fully into view, or null if it already is.
 * `headerHeight` accounts for a sticky header overlapping the top of the viewport.
 */
export function getScrollTopForIndex(
  index: number,
  scrollTop: number,
  viewportHeight: number,
  rowHeight: number,
  headerHeight = 0,
): number | null {
  const rowTop = index * rowHeight;
  const rowBottom = rowTop + rowHeight;
  const visibleTop = scrollTop;
  const visibleBottom = scrollTop + viewportHeight - headerHeight;
  if (rowTop < visibleTop) return rowTop;
  if (rowBottom > visibleBottom) return rowBottom - (viewportHeight - headerHeight);
  return null;
}
