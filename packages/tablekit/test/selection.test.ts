import { getSelectAllStatus, selectRange, setAllSelected, toggleRowSelected } from '../src/core';

describe('selection', () => {
  it('toggles a row and keeps identity when unchanged', () => {
    const a = toggleRowSelected({}, 'x');
    expect(a).toEqual({ x: true });
    expect(toggleRowSelected(a, 'x', true)).toBe(a);
    expect(toggleRowSelected(a, 'x')).toEqual({});
    expect(toggleRowSelected({}, 'y', false)).toEqual({});
  });

  it('selects and deselects a range in either direction', () => {
    const ids = ['a', 'b', 'c', 'd', 'e'];
    expect(selectRange({}, ids, 3, 1)).toEqual({ b: true, c: true, d: true });
    expect(selectRange({ a: true, b: true, c: true }, ids, 1, 2, false)).toEqual({ a: true });
    expect(selectRange({}, ids, -5, 99)).toEqual({ a: true, b: true, c: true, d: true, e: true });
  });

  it('selects all of a subset, preserving others', () => {
    expect(setAllSelected({ z: true }, ['a', 'b'], true)).toEqual({ z: true, a: true, b: true });
    expect(setAllSelected({ z: true, a: true }, ['a', 'b'], false)).toEqual({ z: true });
  });

  it('reports select-all status', () => {
    expect(getSelectAllStatus({}, [])).toBe('none');
    expect(getSelectAllStatus({}, ['a'])).toBe('none');
    expect(getSelectAllStatus({ a: true }, ['a', 'b'])).toBe('some');
    expect(getSelectAllStatus({ a: true, b: true, z: true }, ['a', 'b'])).toBe('all');
  });
});
