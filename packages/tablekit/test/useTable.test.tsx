import { act, renderHook } from '@testing-library/react';
import { useTable, type UseTableOptions } from '../src';
import { columns, users, type User } from './fixtures';

const base: UseTableOptions<User> = { data: users, columns, getRowId: (r) => r.id };
const names = (rows: readonly User[]) => rows.map((r) => r.name);

describe('useTable (uncontrolled)', () => {
  it('returns rows in data order by default', () => {
    const { result } = renderHook(() => useTable(base));
    expect(result.current.rowIds).toEqual(['1', '2', '3', '4', '5']);
    expect(result.current.rowCount).toBe(5);
  });

  it('sorts, multi-sorts and reports direction', () => {
    const { result } = renderHook(() => useTable(base));
    act(() => result.current.toggleSort('name'));
    expect(names(result.current.rows)[0]).toBe('alice');
    expect(result.current.getSortDirection('name')).toBe('asc');
    act(() => result.current.toggleSort('age', true));
    expect(result.current.state.sorting).toHaveLength(2);
    expect(result.current.getSortIndex('age')).toBe(1);
    // A plain click continues that column's cycle and drops the other sorts.
    act(() => result.current.toggleSort('age'));
    expect(result.current.state.sorting).toEqual([{ id: 'age', desc: true }]);
    expect(result.current.getSortDirection('name')).toBe(false);
  });

  it('respects enableMultiSort: false', () => {
    const { result } = renderHook(() => useTable({ ...base, enableMultiSort: false }));
    act(() => result.current.toggleSort('name'));
    act(() => result.current.toggleSort('age', true));
    expect(result.current.state.sorting).toEqual([{ id: 'age', desc: false }]);
  });

  it('filters globally and per column', () => {
    const { result } = renderHook(() => useTable(base));
    act(() => result.current.setGlobalFilter('test.dev'));
    expect(result.current.rowIds).toEqual(['3', '5']);
    act(() => result.current.setColumnFilter('name', 'eve'));
    expect(result.current.rowIds).toEqual(['5']);
    expect(result.current.getColumnFilter('name')).toBe('eve');
    expect(result.current.getColumnFilter('email')).toBe('');
  });

  it('selects rows, ranges and all filtered rows', () => {
    const { result } = renderHook(() => useTable({ ...base, enableRowSelection: true }));
    act(() => result.current.toggleRowSelected('2'));
    expect(result.current.isRowSelected('2')).toBe(true);
    expect(result.current.selectAllStatus).toBe('some');
    act(() => result.current.selectRange(2, 4));
    expect(result.current.selectedRowIds.sort()).toEqual(['2', '3', '4', '5']);
    expect(result.current.getSelectedRows().map((r) => r.id)).toEqual(['2', '3', '4', '5']);

    act(() => result.current.setGlobalFilter('test.dev')); // rows 3, 5
    act(() => result.current.toggleAllRowsSelected(false));
    expect(result.current.selectedRowIds.sort()).toEqual(['2', '4']);
    act(() => result.current.toggleAllRowsSelected());
    expect(result.current.selectAllStatus).toBe('all');
    expect(result.current.selectedRowIds.sort()).toEqual(['2', '3', '4', '5']);
  });

  it('resizes (clamped), resets and pins columns', () => {
    const { result } = renderHook(() => useTable(base));
    act(() => result.current.setColumnWidth('name', 10));
    expect(result.current.layout.columns[0]!.width).toBe(50);
    act(() => result.current.setColumnWidth('missing', 300));
    act(() => result.current.resetColumnWidth('name'));
    expect(result.current.layout.columns[0]!.width).toBe(200);
    act(() => result.current.resetColumnWidth('name'));

    act(() => result.current.toggleColumnPinned('age'));
    expect(result.current.layout.columns[0]!.column.id).toBe('age');
    act(() => result.current.toggleColumnPinned('age', true));
    expect(result.current.state.columnPinning).toEqual(['age']);
    act(() => result.current.toggleColumnPinned('age'));
    expect(result.current.state.columnPinning).toEqual([]);
  });

  it('applies initialState', () => {
    const { result } = renderHook(() =>
      useTable({ ...base, initialState: { sorting: [{ id: 'age', desc: true }] } }),
    );
    expect(names(result.current.rows)[0]).toBe('Charlie');
  });

  it('composes several updates in one act', () => {
    const { result } = renderHook(() => useTable(base));
    act(() => {
      result.current.toggleSort('name');
      result.current.setGlobalFilter('example');
    });
    expect(result.current.state.sorting).toHaveLength(1);
    expect(result.current.state.globalFilter).toBe('example');
  });
});

describe('useTable (controlled + manual)', () => {
  it('fires change callbacks', () => {
    const onSortingChange = vi.fn();
    const onFiltersChange = vi.fn();
    const onGlobalFilterChange = vi.fn();
    const onRowSelectionChange = vi.fn();
    const onColumnSizingChange = vi.fn();
    const onColumnPinningChange = vi.fn();
    const onStateChange = vi.fn();
    const { result } = renderHook(() =>
      useTable({
        ...base,
        onSortingChange,
        onFiltersChange,
        onGlobalFilterChange,
        onRowSelectionChange,
        onColumnSizingChange,
        onColumnPinningChange,
        onStateChange,
      }),
    );
    act(() => result.current.toggleSort('name'));
    act(() => result.current.setColumnFilter('name', 'a'));
    act(() => result.current.setGlobalFilter('x'));
    act(() => result.current.toggleRowSelected('1'));
    act(() => result.current.setColumnWidth('name', 300));
    act(() => result.current.toggleColumnPinned('name'));
    expect(onSortingChange).toHaveBeenCalledWith([{ id: 'name', desc: false }]);
    expect(onFiltersChange).toHaveBeenCalledWith([{ id: 'name', value: 'a' }]);
    expect(onGlobalFilterChange).toHaveBeenCalledWith('x');
    expect(onRowSelectionChange).toHaveBeenCalledWith({ '1': true });
    expect(onColumnSizingChange).toHaveBeenCalledWith({ name: 300 });
    expect(onColumnPinningChange).toHaveBeenCalledWith(['name']);
    expect(onStateChange).toHaveBeenCalledTimes(6);
  });

  it('does not notify when an action is a no-op', () => {
    const onStateChange = vi.fn();
    const { result } = renderHook(() => useTable({ ...base, onStateChange }));
    act(() => result.current.toggleRowSelected('1', false));
    act(() => result.current.setState((s) => s));
    expect(onStateChange).not.toHaveBeenCalled();
  });

  it('controlled state wins over internal state', () => {
    const { result, rerender } = renderHook(
      ({ sorting }) => useTable({ ...base, state: { sorting } }),
      { initialProps: { sorting: [{ id: 'name', desc: true }] } },
    );
    expect(names(result.current.rows)[0]).toBe('Eve');
    act(() => result.current.toggleSort('age'));
    // Parent did not update the prop -> still sorted by name desc.
    expect(result.current.state.sorting).toEqual([{ id: 'name', desc: true }]);
    rerender({ sorting: [] });
    expect(result.current.rowIds).toEqual(['1', '2', '3', '4', '5']);
  });

  it('setState accepts a partial object', () => {
    const { result } = renderHook(() => useTable(base));
    act(() => result.current.setState({ globalFilter: 'bob' }));
    expect(result.current.rowIds).toEqual(['3']);
    act(() => result.current.setSorting([{ id: 'age', desc: false }]));
    expect(result.current.state.sorting).toEqual([{ id: 'age', desc: false }]);
  });

  it('manual modes leave row order/filtering to the server', () => {
    const onSortingChange = vi.fn();
    const { result } = renderHook(() =>
      useTable({
        ...base,
        manualSorting: true,
        manualFiltering: true,
        rowCount: 1000,
        onSortingChange,
      }),
    );
    act(() => result.current.toggleSort('name'));
    act(() => result.current.setGlobalFilter('zzz'));
    expect(result.current.rowIds).toEqual(['1', '2', '3', '4', '5']);
    expect(result.current.rowCount).toBe(1000);
    expect(onSortingChange).toHaveBeenCalled();
  });
});
