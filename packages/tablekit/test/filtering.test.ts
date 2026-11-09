import { defaultFilterFn, filterRows, setColumnFilter } from '../src/core';
import type { ColumnDef } from '../src/core';
import { columns, users, type User } from './fixtures';

const ids = (rows: readonly User[]) => rows.map((r) => r.id);

describe('defaultFilterFn', () => {
  it('matches case-insensitive substrings', () => {
    expect(defaultFilterFn('Hello World', 'wor')).toBe(true);
    expect(defaultFilterFn(42, '4')).toBe(true);
    expect(defaultFilterFn(null, 'a')).toBe(false);
    expect(defaultFilterFn(new Date('2024-01-02T00:00:00Z'), '2024-01')).toBe(true);
  });
});

describe('filterRows', () => {
  it('returns the same array when no filters are active', () => {
    expect(filterRows(users, columns, [], '')).toBe(users);
    expect(filterRows(users, columns, [{ id: 'name', value: '  ' }], '  ')).toBe(users);
  });

  it('applies the global filter to filterable columns only', () => {
    expect(ids(filterRows(users, columns, [], 'test.dev'))).toEqual(['3', '5']);
    // "35" only appears in the non-filterable age column.
    expect(ids(filterRows(users, columns, [], '35'))).toEqual([]);
  });

  it('applies column filters with AND', () => {
    expect(ids(filterRows(users, columns, [{ id: 'email', value: 'example' }], ''))).toEqual([
      '1',
      '2',
      '4',
    ]);
    expect(
      ids(
        filterRows(
          users,
          columns,
          [
            { id: 'email', value: 'example' },
            { id: 'name', value: 'a' },
          ],
          '',
        ),
      ),
    ).toEqual(['1', '2', '4']);
    expect(
      ids(
        filterRows(
          users,
          columns,
          [
            { id: 'email', value: 'example' },
            { id: 'name', value: 'char' },
          ],
          '',
        ),
      ),
    ).toEqual(['1']);
  });

  it('combines column and global filters', () => {
    expect(ids(filterRows(users, columns, [{ id: 'email', value: 'example' }], 'dana'))).toEqual([
      '4',
    ]);
  });

  it('ignores filters for unknown columns', () => {
    expect(filterRows(users, columns, [{ id: 'nope', value: 'x' }], '')).toBe(users);
  });

  it('uses a custom filterFn', () => {
    const cols: ColumnDef<User>[] = [
      {
        id: 'age',
        header: 'Age',
        accessor: (r) => r.age,
        filterable: true,
        filterFn: (r, v) => (r.age ?? 0) >= Number(v),
      },
    ];
    expect(ids(filterRows(users, cols, [{ id: 'age', value: '30' }], ''))).toEqual(['1', '3']);
    expect(ids(filterRows(users, cols, [], '30'))).toEqual(['1', '3']);
  });
});

describe('setColumnFilter', () => {
  it('sets, replaces and clears', () => {
    let f = setColumnFilter([], 'name', 'a');
    expect(f).toEqual([{ id: 'name', value: 'a' }]);
    f = setColumnFilter(f, 'name', 'b');
    expect(f).toEqual([{ id: 'name', value: 'b' }]);
    f = setColumnFilter(f, 'name', '');
    expect(f).toEqual([]);
  });
});
