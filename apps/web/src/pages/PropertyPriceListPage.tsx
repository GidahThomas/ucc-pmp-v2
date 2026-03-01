import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { apiRequest } from '../lib/api';
import { DataTable } from '../components/DataTable';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';

type PriceRecord = {
  id: number;
  property?: { propertyName: string } | null;
  priceType?: { listName: string } | null;
  unitAmount: number;
  period: string | null;
  minMonthlyRent: number | null;
  maxMonthlyRent: number | null;
  createdAt: string;
};

export function PropertyPriceListPage() {
  const { data } = useQuery({
    queryKey: ['property-prices'],
    queryFn: () => apiRequest<PriceRecord[]>('/property-prices'),
  });

  const prices = data ?? [];
  const bucketCounts = prices.reduce<Record<string, number>>((accumulator, price) => {
    const key = price.priceType?.listName ?? 'Other';
    accumulator[key] = (accumulator[key] ?? 0) + 1;
    return accumulator;
  }, {});

  return (
    <>
      <PageHeader
        title="Property Prices"
        subtitle="Pricing view translated from the Yii property price module."
        actions={
          <Link className="button primary" to="/property-price/save">
            Add Property Price
          </Link>
        }
      />
      <div className="stats-grid">
        <StatCard label="Total Prices" value={prices.length} />
        {Object.entries(bucketCounts).map(([key, count]) => (
          <StatCard key={key} label={key} value={count} />
        ))}
      </div>
      <DataTable
        rows={prices}
        columns={[
          { header: 'Property', render: (row) => row.property?.propertyName ?? '-' },
          { header: 'Type', render: (row) => row.priceType?.listName ?? '-' },
          { header: 'Unit Amount', render: (row) => row.unitAmount.toLocaleString() },
          { header: 'Period', render: (row) => row.period ?? '-' },
          { header: 'Min Rent', render: (row) => row.minMonthlyRent?.toLocaleString() ?? '-' },
          { header: 'Max Rent', render: (row) => row.maxMonthlyRent?.toLocaleString() ?? '-' },
          { header: 'Created At', render: (row) => new Date(row.createdAt).toLocaleDateString() },
          {
            header: 'Actions',
            render: (row) => (
              <Link className="button secondary" to={`/property-price/save/${row.id}`}>
                Edit
              </Link>
            ),
          },
        ]}
      />
    </>
  );
}
