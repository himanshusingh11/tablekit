import type { ColumnDef } from '../src';

export type User = { id: string; name: string; email: string; age: number | null };

export const users: User[] = [
  { id: '1', name: 'Charlie', email: 'charlie@example.com', age: 35 },
  { id: '2', name: 'alice', email: 'alice@example.com', age: 28 },
  { id: '3', name: 'Bob', email: 'bob@test.dev', age: 35 },
  { id: '4', name: 'Dana', email: 'dana@example.com', age: null },
  { id: '5', name: 'Eve', email: 'eve@test.dev', age: 22 },
];

export const columns: ColumnDef<User>[] = [
  {
    id: 'name',
    header: 'Name',
    accessor: (r) => r.name,
    sortable: true,
    filterable: true,
    width: 200,
  },
  { id: 'email', header: 'Email', accessor: (r) => r.email, filterable: true },
  { id: 'age', header: 'Age', accessor: (r) => r.age, sortable: true, align: 'right' },
];

export function makeUsers(n: number): User[] {
  return Array.from({ length: n }, (_, i) => ({
    id: String(i),
    name: `User ${i}`,
    email: `user${i}@example.com`,
    age: 20 + (i % 50),
  }));
}
