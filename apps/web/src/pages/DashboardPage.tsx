import { useQuery } from '@tanstack/react-query';

import { apiRequest } from '../lib/api';
import { DataTable } from '../components/DataTable';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';

type DashboardResponse = {
  totalProperties: number;
  usageCounts: { label: string; total: number }[];
  analytics: { typeName: string; total: number }[];
  translationReport: {
    leaseId: number;
    tenantName: string;
    propertyName: string;
    price: number;
    startDate: string;
    endDate: string;
  }[];
};

export function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => apiRequest<DashboardResponse>('/dashboard/summary'),
  });

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Summary counts, property analytics, and current lease report." />
      <div className="stats-grid">
        <StatCard label="Total Properties" value={data?.totalProperties ?? (isLoading ? '...' : 0)} />
        {(data?.usageCounts ?? []).map((item) => (
          <StatCard key={item.label} label={item.label} value={item.total} />
        ))}
      </div>
      <div className="card-grid">
        <div className="surface" style={{ padding: '1rem' }}>
          <h3>Property Analytics</h3>
          {(data?.analytics ?? []).map((item) => (
            <div key={item.typeName} style={{ marginBottom: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{item.typeName}</span>
                <strong>{item.total}</strong>
              </div>
              <div style={{ background: 'var(--surface-muted)', borderRadius: '999px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '10px',
                    width: `${Math.min(item.total * 10, 100)}%`,
                    background: 'var(--primary)',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="surface" style={{ padding: '1rem' }}>
          <h3>Usage Snapshot</h3>
          {(data?.usageCounts ?? []).map((item) => (
            <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
              <span>{item.label}</span>
              <strong>{item.total}</strong>
            </div>
          ))}
        </div>
      </div>
      <DataTable
        rows={data?.translationReport ?? []}
        columns={[
          { header: 'Lease ID', render: (row) => row.leaseId },
          { header: 'Customer Name', render: (row) => row.tenantName },
          { header: 'Property Name', render: (row) => row.propertyName },
          { header: 'Price', render: (row) => `TZS ${row.price.toLocaleString()}` },
          { header: 'Start Date', render: (row) => new Date(row.startDate).toLocaleDateString() },
          { header: 'End Date', render: (row) => new Date(row.endDate).toLocaleDateString() },
        ]}
      />
    </>
  );
}
