import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { apiRequest } from '../lib/api';
import { DataTable } from '../components/DataTable';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';

type BillRecord = {
  id: number;
  amount: number;
  dueDate: string;
  paidDate: string | null;
  billStatus?: { listName: string } | null;
  lease: {
    leaseNumber: string | null;
    uuid: string;
    tenant: { fullName: string };
    property: { propertyName: string };
  };
};

export function BillsPage() {
  const [filter, setFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ['bills', filter],
    queryFn: () => apiRequest<BillRecord[]>(`/billing/bills?filter=${filter}`),
  });

  const deleteBill = useMutation({
    mutationFn: (id: number) => apiRequest(`/billing/bills/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['bills'] });
    },
  });

  const bills = data ?? [];

  return (
    <>
      <PageHeader title="Bills" subtitle="Track generated lease bills and outstanding balances." />
      <div className="stats-grid">
        <StatCard label="Total Bills" value={bills.length} />
        <StatCard label="Paid Bills" value={bills.filter((item) => item.billStatus?.listName.toLowerCase() === 'paid').length} />
        <StatCard label="Pending Bills" value={bills.filter((item) => item.billStatus?.listName.toLowerCase() === 'pending').length} />
        <StatCard label="Overdue Bills" value={bills.filter((item) => item.billStatus?.listName.toLowerCase() === 'overdue').length} />
      </div>
      <div className="segmented">
        {(['all', 'paid', 'unpaid'] as const).map((value) => (
          <button key={value} type="button" className={filter === value ? 'active' : ''} onClick={() => setFilter(value)}>
            {value === 'all' ? 'All Bills' : value === 'paid' ? 'Paid Bills' : 'Unpaid Bills'}
          </button>
        ))}
      </div>
      <DataTable
        rows={bills}
        columns={[
          { header: '#', render: (row) => row.id },
          { header: 'Lease No.', render: (row) => row.lease.leaseNumber ?? row.lease.uuid },
          { header: 'Tenant', render: (row) => row.lease.tenant.fullName },
          { header: 'Property', render: (row) => row.lease.property.propertyName },
          { header: 'Amount', render: (row) => `TZS ${row.amount.toLocaleString()}` },
          { header: 'Due Date', render: (row) => new Date(row.dueDate).toLocaleDateString() },
          { header: 'Status', render: (row) => row.billStatus?.listName ?? 'Unknown' },
          {
            header: 'Actions',
            render: (row) => (
              <button className="button danger" type="button" onClick={() => deleteBill.mutate(row.id)}>
                Delete
              </button>
            ),
          },
        ]}
      />
    </>
  );
}
