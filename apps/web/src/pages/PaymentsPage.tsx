import { useQuery } from '@tanstack/react-query';

import { apiRequest } from '../lib/api';
import { DataTable } from '../components/DataTable';
import { PageHeader } from '../components/PageHeader';

type PaymentRecord = {
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

export function PaymentsPage() {
  const { data } = useQuery({
    queryKey: ['payments'],
    queryFn: () => apiRequest<PaymentRecord[]>('/billing/payments'),
  });

  return (
    <>
      <PageHeader title="Payments" subtitle="Payment view translated from the original bill listing." />
      <DataTable
        rows={data ?? []}
        columns={[
          { header: '#', render: (row) => row.id },
          { header: 'Lease', render: (row) => row.lease.leaseNumber ?? row.lease.uuid },
          { header: 'Tenant', render: (row) => row.lease.tenant.fullName },
          { header: 'Property', render: (row) => row.lease.property.propertyName },
          { header: 'Amount', render: (row) => `TZS ${row.amount.toLocaleString()}` },
          { header: 'Due Date', render: (row) => new Date(row.dueDate).toLocaleDateString() },
          { header: 'Paid Date', render: (row) => (row.paidDate ? new Date(row.paidDate).toLocaleDateString() : '-') },
          { header: 'Status', render: (row) => row.billStatus?.listName ?? 'Unknown' },
        ]}
      />
    </>
  );
}
