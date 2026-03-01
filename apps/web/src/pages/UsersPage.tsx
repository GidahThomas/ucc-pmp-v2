import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { apiRequest } from '../lib/api';
import { DataTable } from '../components/DataTable';
import { PageHeader } from '../components/PageHeader';

type UserRecord = {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  role: string;
  status: string;
};

export function UsersPage() {
  const [filter, setFilter] = useState('all');
  const { data } = useQuery({
    queryKey: ['users', filter],
    queryFn: () => apiRequest<UserRecord[]>(`/users?filter=${filter}`),
  });

  const rows = useMemo(() => data ?? [], [data]);

  return (
    <>
      <PageHeader
        title="User Management"
        subtitle="Translated from the original role-filtered user list."
        actions={
          <Link className="button primary" to="/users/create">
            Add User
          </Link>
        }
      />
      <div className="segmented">
        {['all', 'admin', 'manager', 'tenant'].map((value) => (
          <button key={value} type="button" className={filter === value ? 'active' : ''} onClick={() => setFilter(value)}>
            {value}
          </button>
        ))}
      </div>
      <DataTable
        rows={rows}
        columns={[
          {
            header: 'Users',
            render: (row) => (
              <div>
                <strong>{row.fullName}</strong>
                <div>{row.email}</div>
              </div>
            ),
          },
          { header: 'Role', render: (row) => row.role },
          { header: 'Status', render: (row) => row.status },
          { header: 'Phone', render: (row) => row.phone ?? '-' },
          {
            header: 'Actions',
            render: (row) => (
              <Link className="button secondary" to={`/users/update/${row.id}`}>
                Edit
              </Link>
            ),
          },
        ]}
      />
    </>
  );
}
