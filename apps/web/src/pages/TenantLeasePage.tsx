import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { apiRequest } from '../lib/api';
import { DataTable } from '../components/DataTable';
import { PageHeader } from '../components/PageHeader';

type LeaseRecord = {
  id: number;
  property: { propertyName: string };
  tenant: { fullName: string; email?: string };
  propertyPrice: { unitAmount: number };
  status: { listName: string };
  leaseStartDate: string;
  leaseEndDate: string;
};

export function TenantLeasePage() {
  const params = useParams();
  const { data } = useQuery({
    queryKey: ['tenant-leases', params.id],
    queryFn: () => apiRequest<LeaseRecord[]>(`/leases/tenant/${params.id}`),
  });

  return (
    <>
      <PageHeader title="Tenant Leases" subtitle="Lease history filtered per tenant." />
      <DataTable
        rows={data ?? []}
        columns={[
          { header: 'Tenant', render: (row) => row.tenant.fullName },
          { header: 'Property', render: (row) => row.property.propertyName },
          { header: 'Price', render: (row) => `TZS ${row.propertyPrice.unitAmount.toLocaleString()}` },
          { header: 'Status', render: (row) => row.status.listName },
          {
            header: 'Date',
            render: (row) => `${new Date(row.leaseStartDate).toLocaleDateString()} -> ${new Date(row.leaseEndDate).toLocaleDateString()}`,
          },
        ]}
      />
    </>
  );
}
