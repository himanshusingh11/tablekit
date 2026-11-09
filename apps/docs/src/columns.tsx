import type { ColumnDef } from 'react-tablekit';
import { currency, type Person } from './data';

export const personColumns: ColumnDef<Person>[] = [
  {
    id: 'id',
    header: '#',
    accessor: (r) => Number(r.id),
    sortable: true,
    width: 80,
    align: 'right',
    pinned: true,
  },
  {
    id: 'name',
    header: 'Name',
    accessor: (r) => `${r.firstName} ${r.lastName}`,
    sortable: true,
    filterable: true,
    width: 180,
    pinned: true,
  },
  { id: 'email', header: 'Email', accessor: (r) => r.email, filterable: true, width: 280 },
  { id: 'age', header: 'Age', accessor: (r) => r.age, sortable: true, width: 80, align: 'right' },
  {
    id: 'city',
    header: 'City',
    accessor: (r) => r.city,
    sortable: true,
    filterable: true,
    width: 130,
  },
  {
    id: 'department',
    header: 'Department',
    accessor: (r) => r.department,
    sortable: true,
    filterable: true,
    width: 150,
  },
  {
    id: 'salary',
    header: 'Salary',
    accessor: (r) => r.salary,
    sortable: true,
    width: 120,
    align: 'right',
    cell: (r) => currency.format(r.salary),
  },
  {
    id: 'startDate',
    header: 'Start date',
    accessor: (r) => r.startDate,
    sortable: true,
    width: 130,
  },
  {
    id: 'active',
    header: 'Status',
    accessor: (r) => r.active,
    sortable: true,
    width: 110,
    cell: (r) => (
      <span className={`badge ${r.active ? 'badge-on' : 'badge-off'}`}>
        {r.active ? 'Active' : 'Inactive'}
      </span>
    ),
  },
];
