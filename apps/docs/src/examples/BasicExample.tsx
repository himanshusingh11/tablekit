import { DataTable, useTable, type ColumnDef } from 'react-tablekit';
import 'react-tablekit/styles.css';

type User = { id: string; name: string; email: string; age: number };

const data: User[] = [
  { id: '1', name: 'Maya Chen', email: 'maya@example.com', age: 31 },
  { id: '2', name: 'Liam Okafor', email: 'liam@example.com', age: 27 },
  { id: '3', name: 'Priya Sharma', email: 'priya@example.com', age: 44 },
  { id: '4', name: 'Noah Smith', email: 'noah@example.com', age: 22 },
  { id: '5', name: 'Zara Haddad', email: 'zara@example.com', age: 36 },
  { id: '6', name: 'Kai Ito', email: 'kai@example.com', age: 29 },
];

// Define columns outside the component (or useMemo) so they stay referentially stable.
const columns: ColumnDef<User>[] = [
  {
    id: 'name',
    header: 'Name',
    accessor: (r) => r.name,
    sortable: true,
    filterable: true,
    width: 200,
  },
  { id: 'email', header: 'Email', accessor: (r) => r.email, filterable: true, width: 240 },
  { id: 'age', header: 'Age', accessor: (r) => r.age, sortable: true, align: 'right', width: 100 },
];

export function BasicExample() {
  const table = useTable({ data, columns, getRowId: (r) => r.id });

  return (
    <div>
      <input
        className="search"
        type="search"
        placeholder="Search name or email…"
        aria-label="Search users"
        value={table.state.globalFilter}
        onChange={(e) => table.setGlobalFilter(e.target.value)}
      />
      <DataTable table={table} height={300} rowHeight={40} aria-label="Users" />
    </div>
  );
}
