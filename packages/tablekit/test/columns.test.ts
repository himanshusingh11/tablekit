import { clampWidth, getColumnLayout, getColumnWidth, getInitialPinning } from '../src/core';
import type { ColumnDef } from '../src/core';

type R = { a: number };
const col = (id: string, extra: Partial<ColumnDef<R>> = {}): ColumnDef<R> => ({
  id,
  header: id,
  accessor: (r) => r.a,
  ...extra,
});

describe('column sizing', () => {
  it('clamps to min/max (with defaults)', () => {
    expect(clampWidth(col('a'), 10)).toBe(50);
    expect(clampWidth(col('a'), 5000)).toBe(1000);
    expect(clampWidth(col('a', { minWidth: 80, maxWidth: 120 }), 200)).toBe(120);
    expect(clampWidth(col('a'), 99.6)).toBe(100);
  });

  it('prefers sizing state over the column default', () => {
    expect(getColumnWidth(col('a'), {})).toBe(150);
    expect(getColumnWidth(col('a', { width: 90 }), {})).toBe(90);
    expect(getColumnWidth(col('a', { width: 90 }), { a: 300 })).toBe(300);
  });
});

describe('getColumnLayout', () => {
  const cols = [
    col('a', { width: 100 }),
    col('b', { width: 200, pinned: true }),
    col('c', { width: 50 }),
  ];

  it('derives initial pinning from column defs', () => {
    expect(getInitialPinning(cols)).toEqual(['b']);
  });

  it('orders pinned first and computes offsets', () => {
    const l = getColumnLayout(cols, {}, ['b']);
    expect(l.columns.map((c) => c.column.id)).toEqual(['b', 'a', 'c']);
    expect(l.columns.map((c) => c.left)).toEqual([0, 200, 300]);
    expect(l.columns.map((c) => c.isLastPinned)).toEqual([true, false, false]);
    expect(l.totalWidth).toBe(350);
    expect(l.pinnedWidth).toBe(200);
  });

  it('ignores unknown pinned ids and handles no pinning', () => {
    const l = getColumnLayout(cols, { a: 120 }, ['zzz']);
    expect(l.columns.map((c) => c.column.id)).toEqual(['a', 'b', 'c']);
    expect(l.columns[0]!.width).toBe(120);
    expect(l.pinnedWidth).toBe(0);
    expect(l.columns.some((c) => c.pinned)).toBe(false);
  });
});
