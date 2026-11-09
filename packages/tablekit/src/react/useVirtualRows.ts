import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { getVirtualRange, type VirtualRange } from '../core/virtual';

const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export interface UseVirtualRowsOptions {
  /** The scrolling element. */
  scrollRef: RefObject<HTMLElement | null>;
  rowCount: number;
  rowHeight: number;
  /** Viewport height used before (or instead of) measuring the element. */
  height: number;
  /** Space at the top of the viewport covered by a sticky header. */
  headerHeight?: number;
  overscan?: number;
}

export interface UseVirtualRowsResult extends VirtualRange {
  /** Height of the area rows are visible in (viewport minus sticky header). */
  bodyHeight: number;
  /** Re-read scroll position (e.g. after programmatic scroll). */
  sync: () => void;
}

/**
 * Tracks scroll position of `scrollRef` and returns which rows to render.
 * State only changes when the rendered window changes, not on every scroll pixel.
 */
export function useVirtualRows({
  scrollRef,
  rowCount,
  rowHeight,
  height,
  headerHeight = 0,
  overscan = 5,
}: UseVirtualRowsOptions): UseVirtualRowsResult {
  const [viewport, setViewport] = useState(height);
  const [scrollTop, setScrollTop] = useState(0);
  const bodyHeight = Math.max(0, viewport - headerHeight);

  const range = getVirtualRange(scrollTop, bodyHeight, rowHeight, rowCount, overscan);
  const rangeRef = useRef(range);
  rangeRef.current = range;
  const paramsRef = useRef({ bodyHeight, rowHeight, rowCount, overscan, headerHeight });
  paramsRef.current = { bodyHeight, rowHeight, rowCount, overscan, headerHeight };

  const sync = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const top = el.scrollTop;
    const p = paramsRef.current;
    const next = getVirtualRange(top, p.bodyHeight, p.rowHeight, p.rowCount, p.overscan);
    const cur = rangeRef.current;
    if (next.start !== cur.start || next.end !== cur.end) setScrollTop(top);
  }, [scrollRef]);

  useIsoLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', sync, { passive: true });
    return () => el.removeEventListener('scroll', sync);
  }, [scrollRef, sync]);

  // Measure the real viewport height when layout is available (responsive containers).
  useIsoLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const measure = () => {
      const h = el.clientHeight;
      setViewport(h > 0 ? h : height);
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [scrollRef, height]);

  // When rows shrink (e.g. filtering) the browser clamps scrollTop, and a resize changes the window; re-sync.
  useIsoLayoutEffect(() => {
    sync();
  }, [rowCount, bodyHeight, rowHeight, sync]);

  return { ...range, bodyHeight, sync };
}
