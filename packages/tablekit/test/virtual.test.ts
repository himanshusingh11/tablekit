import { getScrollTopForIndex, getVirtualRange } from '../src/core';

describe('getVirtualRange', () => {
  it('renders the visible window plus overscan', () => {
    // 400px viewport, 40px rows -> 10 visible rows.
    expect(getVirtualRange(0, 400, 40, 100_000, 5)).toEqual({
      start: 0,
      end: 15,
      offset: 0,
      totalHeight: 4_000_000,
    });
    const r = getVirtualRange(4000, 400, 40, 100_000, 5);
    expect(r.start).toBe(95);
    expect(r.end).toBe(115);
    expect(r.offset).toBe(95 * 40);
  });

  it('handles partial rows and clamps to bounds', () => {
    expect(getVirtualRange(20, 400, 40, 100, 0)).toMatchObject({ start: 0, end: 11 });
    expect(getVirtualRange(1e9, 400, 40, 100, 2)).toMatchObject({ start: 88, end: 100 });
    expect(getVirtualRange(-50, 400, 40, 100, 0)).toMatchObject({ start: 0, end: 10 });
  });

  it('handles fewer rows than the viewport and empty data', () => {
    expect(getVirtualRange(0, 400, 40, 3, 5)).toMatchObject({ start: 0, end: 3, totalHeight: 120 });
    expect(getVirtualRange(0, 400, 40, 0, 5)).toEqual({
      start: 0,
      end: 0,
      offset: 0,
      totalHeight: 0,
    });
    expect(getVirtualRange(0, 0, 40, 10, 0)).toMatchObject({ start: 0, end: 1 });
  });
});

describe('getScrollTopForIndex', () => {
  it('returns null when the row is visible', () => {
    expect(getScrollTopForIndex(2, 0, 400, 40, 40)).toBeNull();
  });
  it('scrolls up to reveal a row above', () => {
    expect(getScrollTopForIndex(5, 400, 400, 40, 40)).toBe(200);
  });
  it('scrolls down accounting for the sticky header', () => {
    // body viewport = 360px; row 20 bottom = 840 -> scrollTop 480
    expect(getScrollTopForIndex(20, 0, 400, 40, 40)).toBe(480);
  });
});
