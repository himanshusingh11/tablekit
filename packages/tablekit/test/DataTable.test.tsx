import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { configureAxe } from 'vitest-axe';
import { DataTable, useTable, type DataTableProps, type UseTableOptions } from '../src';
import { columns, makeUsers, users, type User } from './fixtures';

// jsdom has no canvas/layout, so colour contrast is checked in the browser instead.
const axe = configureAxe({ rules: { 'color-contrast': { enabled: false } } });

function Harness({
  options,
  tableProps,
}: {
  options?: Partial<UseTableOptions<User>>;
  tableProps?: Partial<DataTableProps<User>>;
}) {
  const table = useTable<User>({ data: users, columns, getRowId: (r) => r.id, ...options });
  return <DataTable table={table} height={400} rowHeight={40} aria-label="Users" {...tableProps} />;
}

const grid = () => screen.getByRole('grid', { name: 'Users' });
const bodyRows = () => screen.getAllByRole('row').slice(1);
const firstColumnText = () =>
  bodyRows().map((r) => within(r).getAllByRole('gridcell')[0]!.textContent);

describe('<DataTable /> rendering & ARIA', () => {
  it('renders an ARIA grid with headers and rows', () => {
    render(<Harness />);
    const g = grid();
    expect(g).toHaveAttribute('aria-rowcount', '6');
    expect(g).toHaveAttribute('aria-colcount', '3');
    expect(screen.getAllByRole('columnheader').map((h) => h.textContent)).toEqual([
      expect.stringContaining('Name'),
      'Email',
      expect.stringContaining('Age'),
    ]);
    expect(bodyRows()).toHaveLength(5);
    expect(bodyRows()[0]).toHaveAttribute('aria-rowindex', '2');
  });

  it('has no axe violations (with selection, sorting, pinning)', async () => {
    const { container } = render(
      <Harness
        options={{
          enableRowSelection: true,
          initialState: { sorting: [{ id: 'name', desc: false }], columnPinning: ['name'] },
        }}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no axe violations when empty or loading', async () => {
    const { container, rerender } = render(
      <Harness options={{ data: [] }} tableProps={{ emptyState: 'Nothing here' }} />,
    );
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
    rerender(<Harness tableProps={{ loading: true }} />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading…');
    expect(grid()).toHaveAttribute('aria-busy', 'true');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('uses custom cell renderers and formats values', () => {
    render(
      <Harness
        options={{
          columns: [
            {
              id: 'name',
              header: 'Name',
              accessor: (r) => r.name,
              cell: (r) => <strong>{r.name}!</strong>,
            },
            { id: 'age', header: 'Age', accessor: (r) => r.age },
          ],
        }}
      />,
    );
    expect(screen.getByText('Charlie!').tagName).toBe('STRONG');
    // null age renders empty
    expect(within(bodyRows()[3]!).getAllByRole('gridcell')[1]).toHaveTextContent('');
  });
});

describe('<DataTable /> virtualization', () => {
  it('renders only the visible window for 100K rows with correct aria-rowindex', () => {
    const data = makeUsers(100_000);
    render(<Harness options={{ data }} />);
    expect(grid()).toHaveAttribute('aria-rowcount', '100001');
    // (400 - 40 header) / 40 = 9 visible + 5 overscan
    expect(bodyRows().length).toBe(14);

    const scroller = grid();
    scroller.scrollTop = 40 * 50_000;
    fireEvent.scroll(scroller);
    const rows = bodyRows();
    expect(rows.length).toBeLessThan(30);
    expect(rows[0]).toHaveAttribute('aria-rowindex', String(50_000 - 5 + 2));
    expect(within(rows[0]!).getAllByRole('gridcell')[0]).toHaveTextContent('User 49995');
  });
});

describe('<DataTable /> sorting', () => {
  it('cycles asc -> desc -> none on header click and sets aria-sort', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const nameHeader = screen.getByRole('columnheader', { name: /Name/ });
    expect(nameHeader).not.toHaveAttribute('aria-sort');
    await user.click(nameHeader);
    expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');
    expect(firstColumnText()[0]).toBe('alice');
    await user.click(nameHeader);
    expect(nameHeader).toHaveAttribute('aria-sort', 'descending');
    expect(firstColumnText()[0]).toBe('Eve');
    await user.click(nameHeader);
    expect(nameHeader).not.toHaveAttribute('aria-sort');
    expect(firstColumnText()[0]).toBe('Charlie');
  });

  it('shift+click multi-sorts and shows sort order', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('columnheader', { name: /Age/ }));
    await user.keyboard('{Shift>}');
    await user.click(screen.getByRole('columnheader', { name: /Name/ }));
    await user.keyboard('{/Shift}');
    expect(firstColumnText()).toEqual(['Eve', 'alice', 'Bob', 'Charlie', 'Dana']);
    expect(screen.getByRole('columnheader', { name: /Name/ })).toHaveTextContent('2');
  });

  it('does not sort non-sortable columns', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('columnheader', { name: 'Email' }));
    expect(firstColumnText()[0]).toBe('Charlie');
  });
});

describe('<DataTable /> selection', () => {
  it('toggles rows, shift-selects a range and selects all filtered rows', async () => {
    const user = userEvent.setup();
    const onRowSelectionChange = vi.fn();
    render(<Harness options={{ enableRowSelection: true, onRowSelectionChange }} />);
    expect(grid()).toHaveAttribute('aria-multiselectable', 'true');
    expect(grid()).toHaveAttribute('aria-colcount', '4');

    await user.click(screen.getByLabelText('Select row 1'));
    expect(bodyRows()[0]).toHaveAttribute('aria-selected', 'true');

    await user.keyboard('{Shift>}');
    await user.click(screen.getByLabelText('Select row 4'));
    await user.keyboard('{/Shift}');
    expect(onRowSelectionChange).toHaveBeenLastCalledWith({
      '1': true,
      '2': true,
      '3': true,
      '4': true,
    });

    const selectAll = screen.getByLabelText('Select all rows') as HTMLInputElement;
    expect(selectAll.indeterminate).toBe(true);
    await user.click(selectAll);
    expect(selectAll.checked).toBe(true);
    expect(bodyRows().every((r) => r.getAttribute('aria-selected') === 'true')).toBe(true);
    await user.click(selectAll);
    expect(bodyRows().some((r) => r.getAttribute('aria-selected') === 'true')).toBe(false);
  });

  it('calls onRowClick on click without triggering it from the checkbox', async () => {
    const user = userEvent.setup();
    const onRowClick = vi.fn();
    render(<Harness options={{ enableRowSelection: true }} tableProps={{ onRowClick }} />);
    await user.click(screen.getByText('Bob'));
    expect(onRowClick).toHaveBeenCalledWith(users[2], 2);
    await user.click(screen.getByLabelText('Select row 1'));
    expect(onRowClick).toHaveBeenCalledTimes(1);
  });
});

describe('<DataTable /> keyboard navigation', () => {
  const focused = () => document.activeElement as HTMLElement;
  const pos = () => focused().getAttribute('data-tk-cell');

  it('has exactly one tab stop (roving tabindex)', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const tabbable = grid().querySelectorAll('[tabindex="0"]');
    expect(tabbable).toHaveLength(1);
    await user.tab();
    expect(focused()).toHaveTextContent('Name');
    await user.tab();
    expect(grid().contains(focused())).toBe(false);
  });

  it('moves with arrows, Home/End, Ctrl+Home/End and PageUp/PageDown', async () => {
    const user = userEvent.setup();
    render(<Harness options={{ data: makeUsers(100) }} />);
    await user.tab();
    expect(pos()).toBe('0:0');
    await user.keyboard('{ArrowDown}');
    expect(pos()).toBe('1:0');
    await user.keyboard('{ArrowRight}{ArrowRight}{ArrowRight}');
    expect(pos()).toBe('1:2');
    await user.keyboard('{Home}');
    expect(pos()).toBe('1:0');
    await user.keyboard('{End}');
    expect(pos()).toBe('1:2');
    await user.keyboard('{ArrowUp}{ArrowUp}');
    expect(pos()).toBe('0:2');
    await user.keyboard('{PageDown}');
    expect(pos()).toBe('9:2');
    await user.keyboard('{PageUp}{PageUp}');
    expect(pos()).toBe('1:2');
    await user.keyboard('{Control>}{End}{/Control}');
    expect(pos()).toBe('100:2');
    expect(focused().closest('[role=row]')).toHaveAttribute('aria-rowindex', '101');
    await user.keyboard('{Control>}{Home}{/Control}');
    expect(pos()).toBe('1:0');
    // only one tab stop after moving
    expect(grid().querySelectorAll('[tabindex="0"]')).toHaveLength(1);
  });

  it('sorts with Enter on a header and selects with Space on a row', async () => {
    const user = userEvent.setup();
    render(<Harness options={{ enableRowSelection: true }} />);
    await user.tab(); // select-all header cell
    await user.keyboard('{ArrowRight}{Enter}');
    expect(screen.getByRole('columnheader', { name: /Name/ })).toHaveAttribute(
      'aria-sort',
      'ascending',
    );
    await user.keyboard('{ArrowDown} ');
    expect(bodyRows()[0]).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{ArrowDown}{ArrowDown}{Shift>} {/Shift}');
    expect(bodyRows().filter((r) => r.getAttribute('aria-selected') === 'true')).toHaveLength(3);
    await user.keyboard('{Control>}{Home}{/Control}{ArrowUp}{ArrowLeft} ');
    expect(screen.getByLabelText<HTMLInputElement>('Select all rows').checked).toBe(true);
    await user.keyboard(' ');
    expect(screen.getByLabelText<HTMLInputElement>('Select all rows').checked).toBe(false);
    await user.keyboard('{Control>}a{/Control}');
    expect(screen.getByLabelText<HTMLInputElement>('Select all rows').checked).toBe(true);
  });

  it('Enter on a body row calls onRowClick', async () => {
    const user = userEvent.setup();
    const onRowClick = vi.fn();
    render(<Harness tableProps={{ onRowClick }} />);
    await user.tab();
    await user.keyboard('{ArrowDown}{Enter}');
    expect(onRowClick).toHaveBeenCalledWith(users[0], 0);
  });

  it('Alt+Arrow resizes the focused header column', async () => {
    const user = userEvent.setup();
    const onColumnSizingChange = vi.fn();
    render(<Harness options={{ onColumnSizingChange }} />);
    await user.tab();
    await user.keyboard('{Alt>}{ArrowRight}{/Alt}');
    expect(onColumnSizingChange).toHaveBeenLastCalledWith({ name: 210 });
    expect(screen.getByRole('columnheader', { name: /Name/ })).toHaveStyle({ width: '210px' });
  });

  it('clicking a cell makes it the active cell', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByText('bob@test.dev'));
    expect(pos()).toBe('3:1');
    await user.keyboard('{ArrowDown}');
    expect(pos()).toBe('4:1');
  });
});

describe('<DataTable /> column resize (pointer)', () => {
  it('drags the handle to resize and double-click resets', () => {
    const onColumnSizingChange = vi.fn();
    render(<Harness options={{ onColumnSizingChange }} />);
    const header = screen.getByRole('columnheader', { name: /Name/ });
    const handle = header.querySelector('.tk-resizer')!;
    fireEvent.pointerDown(handle, { clientX: 100, pointerId: 1 });
    fireEvent.pointerMove(handle, { clientX: 160, pointerId: 1 });
    fireEvent.pointerUp(handle, { clientX: 160, pointerId: 1 });
    expect(onColumnSizingChange).toHaveBeenLastCalledWith({ name: 260 });
    expect(header).toHaveStyle({ width: '260px' });
    // click after resizing must not sort
    fireEvent.click(handle);
    expect(header).not.toHaveAttribute('aria-sort');
    fireEvent.doubleClick(handle);
    expect(header).toHaveStyle({ width: '200px' });
  });
});

describe('<DataTable /> pinning', () => {
  it('renders pinned columns first with sticky offsets', () => {
    render(
      <Harness options={{ enableRowSelection: true, initialState: { columnPinning: ['age'] } }} />,
    );
    const headers = screen.getAllByRole('columnheader');
    expect(headers[1]).toHaveTextContent('Age');
    expect(headers[1]).toHaveClass('tk-pinned', 'tk-last-pinned');
    expect(headers[1]).toHaveStyle({ left: '44px' });
    expect(headers[0]).toHaveClass('tk-pinned');
    expect(headers[0]).not.toHaveClass('tk-last-pinned');
    expect(headers[2]).not.toHaveClass('tk-pinned');
  });
});
