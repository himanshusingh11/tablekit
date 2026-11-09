import { compareValues, getNextSorting, sortRows } from '../src/core';
import { columns, users, type User } from './fixtures';
import type { ColumnDef } from '../src/core';

const names = (rows: readonly User[]) => rows.map((r) => r.name);

describe('getNextSorting', () => {
  it('cycles asc -> desc -> none for a single column', () => {
    let s = getNextSorting([], 'name');
    expect(s).toEqual([{ id: 'name', desc: false }]);
    s = getNextSorting(s, 'name');
    expect(s).toEqual([{ id: 'name', desc: true }]);
    s = getNextSorting(s, 'name');
    expect(s).toEqual([]);
  });

  it('replaces other columns without multi', () => {
    expect(getNextSorting([{ id: 'age', desc: false }], 'name')).toEqual([
      { id: 'name', desc: false },
    ]);
  });

  it('appends, updates and removes with multi', () => {
    let s = getNextSorting([{ id: 'age', desc: false }], 'name', true);
    expect(s).toEqual([
      { id: 'age', desc: false },
      { id: 'name', desc: false },
    ]);
    s = getNextSorting(s, 'name', true);
    expect(s[1]).toEqual({ id: 'name', desc: true });
    s = getNextSorting(s, 'name', true);
    expect(s).toEqual([{ id: 'age', desc: false }]);
  });
});

describe('compareValues', () => {
  it('compares numbers, strings (natural, case-insensitive), dates and booleans', () => {
    expect(compareValues(1, 2)).toBeLessThan(0);
    expect(compareValues('item 2', 'item 10')).toBeLessThan(0);
    expect(compareValues('a', 'B')).toBeLessThan(0);
    expect(compareValues(new Date(2020, 0, 1), new Date(2021, 0, 1))).toBeLessThan(0);
    expect(compareValues(false, true)).toBeLessThan(0);
    expect(compareValues(true, false)).toBeGreaterThan(0);
    expect(compareValues(3, 3)).toBe(0);
  });

  it('puts nullish and NaN last', () => {
    expect(compareValues(null, 1)).toBeGreaterThan(0);
    expect(compareValues(1, undefined)).toBeLessThan(0);
    expect(compareValues(NaN, 1)).toBeGreaterThan(0);
    expect(compareValues(1, NaN)).toBeLessThan(0);
    expect(compareValues(NaN, NaN)).toBe(0);
  });
});

describe('sortRows', () => {
  it('returns the same array when not sorting', () => {
    expect(sortRows(users, [], columns)).toBe(users);
    expect(sortRows(users, [{ id: 'missing', desc: false }], columns)).toBe(users);
  });

  it('sorts ascending and descending', () => {
    expect(names(sortRows(users, [{ id: 'name', desc: false }], columns))).toEqual([
      'alice',
      'Bob',
      'Charlie',
      'Dana',
      'Eve',
    ]);
    expect(names(sortRows(users, [{ id: 'name', desc: true }], columns))).toEqual([
      'Eve',
      'Dana',
      'Charlie',
      'Bob',
      'alice',
    ]);
  });

  it('is stable and keeps nulls last in both directions', () => {
    // Charlie and Bob both 35: original order (Charlie first) must be preserved.
    expect(names(sortRows(users, [{ id: 'age', desc: false }], columns))).toEqual([
      'Eve',
      'alice',
      'Charlie',
      'Bob',
      'Dana',
    ]);
    expect(names(sortRows(users, [{ id: 'age', desc: true }], columns))).toEqual([
      'Charlie',
      'Bob',
      'alice',
      'Eve',
      'Dana',
    ]);
  });

  it('multi-sorts by secondary column', () => {
    const sorted = sortRows(
      users,
      [
        { id: 'age', desc: true },
        { id: 'name', desc: false },
      ],
      columns,
    );
    expect(names(sorted)).toEqual(['Bob', 'Charlie', 'alice', 'Eve', 'Dana']);
  });

  it('uses a custom sortFn', () => {
    const cols: ColumnDef<User>[] = [
      {
        id: 'len',
        header: 'Len',
        accessor: (r) => r.name,
        sortFn: (a, b) => a.name.length - b.name.length,
      },
    ];
    expect(names(sortRows(users, [{ id: 'len', desc: false }], cols))).toEqual([
      'Bob',
      'Eve',
      'Dana',
      'alice',
      'Charlie',
    ]);
    expect(names(sortRows(users, [{ id: 'len', desc: true }], cols))[0]).toBe('Charlie');
  });

  it('does not mutate input', () => {
    const copy = [...users];
    sortRows(users, [{ id: 'name', desc: false }], columns);
    expect(users).toEqual(copy);
  });
});
