import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';

import { apiRequest } from '../lib/api';
import { DataTable } from '../components/DataTable';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';

type LeaseRecord = {
  id: number;
  tenantId: number;
  property: { propertyName: string };
  tenant: { fullName: string };
  propertyPrice: { unitAmount: number };
  status: { listName: string };
  leaseStartDate: string;
  leaseEndDate: string;
  durationMonths: number;
};

export function LeaseListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ['leases'],
    queryFn: () => apiRequest<LeaseRecord[]>('/leases'),
  });

  const terminateLease = useMutation({
    mutationFn: (id: number) => apiRequest(`/leases/${id}/terminate`, { method: 'POST' }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['leases'] }),
  });

  const deleteLease = useMutation({
    mutationFn: (id: number) => apiRequest(`/leases/${id}`, { method: 'DELETE' }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['leases'] }),
  });

  const leases = data ?? [];

  return (
    <>
      <PageHeader
        title="Leases"
        subtitle="Active, pending, expiring, and terminated lease tracking."
        actions={
          <Link className="button primary" to="/custom/create-lease">
            Create Lease
          </Link>
        }
      />
      <div className="stats-grid">
        <StatCard label="Total Leases" value={leases.length} />
        <StatCard label="Active Leases" value={leases.filter((item) => item.status.listName === 'Active').length} />
        <StatCard label="Pending Leases" value={leases.filter((item) => item.status.listName === 'Pending').length} />
        <StatCard label="Terminated Leases" value={leases.filter((item) => item.status.listName === 'Terminated').length} />
      </div>
      <DataTable
        rows={leases}
        columns={[
          { header: 'ID', render: (row) => row.id },
          { header: 'Property', render: (row) => row.property.propertyName },
          { header: 'Tenant', render: (row) => row.tenant.fullName },
          { header: 'Price', render: (row) => `TZS ${row.propertyPrice.unitAmount.toLocaleString()}` },
          { header: 'Status', render: (row) => row.status.listName },
          {
            header: 'Lease Period',
            render: (row) => `${new Date(row.leaseStartDate).toLocaleDateString()} -> ${new Date(row.leaseEndDate).toLocaleDateString()}`,
          },
          { header: 'Duration (Months)', render: (row) => row.durationMonths },
          {
            header: 'Actions',
            render: (row) => (
              <div className="form-actions">
                <button className="button secondary" type="button" onClick={() => navigate(`/custom/view-lease/${row.tenantId}`)}>
                  View
                </button>
                <button className="button secondary" type="button" onClick={() => navigate(`/custom/renew/${row.id}`)}>
                  Renew
                </button>
                <button className="button secondary" type="button" onClick={() => terminateLease.mutate(row.id)}>
                  Terminate
                </button>
                <button className="button danger" type="button" onClick={() => deleteLease.mutate(row.id)}>
                  Delete
                </button>
              </div>
            ),
          },
        ]}
      />
    </>
  );
}
