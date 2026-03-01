import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { apiRequest } from '../lib/api';
import { PageHeader } from '../components/PageHeader';

type MetadataResponse = {
  ownershipTypes: { id: number; listName: string }[];
  propertyStatuses: { id: number; listName: string }[];
};

type PropertyRecord = {
  id: number;
  propertyName: string;
  description: string | null;
  documentUrl: string | null;
  street?: { streetName: string } | null;
  propertyStatus?: { listName: string } | null;
  prices: { unitAmount: number }[];
};

export function PropertyListPage() {
  const [filters, setFilters] = useState({
    propertyName: '',
    ownershipTypeId: '',
    propertyStatusId: '',
  });
  const { data: metadata } = useQuery({
    queryKey: ['property-metadata'],
    queryFn: () => apiRequest<MetadataResponse>('/properties/metadata'),
  });
  const { data: properties, refetch } = useQuery({
    queryKey: ['properties', filters],
    queryFn: () =>
      apiRequest<PropertyRecord[]>(
        `/properties?propertyName=${encodeURIComponent(filters.propertyName)}&ownershipTypeId=${filters.ownershipTypeId}&propertyStatusId=${filters.propertyStatusId}`,
      ),
  });

  function handleFilter(event: FormEvent) {
    event.preventDefault();
    void refetch();
  }

  return (
    <>
      <PageHeader
        title="Properties"
        subtitle="Card-based property listing translated from the original Yii index."
        actions={
          <Link className="button primary" to="/property/create">
            Add New Property
          </Link>
        }
      />
      <form className="surface" style={{ padding: '1.5rem' }} onSubmit={handleFilter}>
        <div className="filter-grid">
          <div className="field">
            <label htmlFor="propertyName">Search by name</label>
            <input id="propertyName" value={filters.propertyName} onChange={(event) => setFilters((current) => ({ ...current, propertyName: event.target.value }))} />
          </div>
          <div className="field">
            <label htmlFor="ownershipTypeId">Ownership type</label>
            <select id="ownershipTypeId" value={filters.ownershipTypeId} onChange={(event) => setFilters((current) => ({ ...current, ownershipTypeId: event.target.value }))}>
              <option value="">Search Ownership Types</option>
              {(metadata?.ownershipTypes ?? []).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.listName}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="propertyStatusId">Property status</label>
            <select id="propertyStatusId" value={filters.propertyStatusId} onChange={(event) => setFilters((current) => ({ ...current, propertyStatusId: event.target.value }))}>
              <option value="">Search By Status</option>
              {(metadata?.propertyStatuses ?? []).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.listName}
                </option>
              ))}
            </select>
          </div>
          <div className="form-actions" style={{ alignItems: 'end' }}>
            <button className="button primary" type="submit">
              Filter
            </button>
          </div>
        </div>
      </form>
      <div className="card-grid">
        {(properties ?? []).map((property) => (
          <article key={property.id} className="surface property-card">
            {property.documentUrl ? (
              <img className="property-image" src={property.documentUrl} alt={property.propertyName} />
            ) : (
              <div className="property-image" />
            )}
            <div className="property-body">
              <div>
                <strong>{property.propertyName}</strong>
                <div style={{ color: 'var(--text-secondary)' }}>{property.street?.streetName ?? 'No Location'}</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Status</span>
                <span className="badge success">{property.propertyStatus?.listName ?? 'Unknown'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Price</span>
                <strong>TZS {property.prices[0]?.unitAmount?.toLocaleString() ?? '0'}</strong>
              </div>
              <div className="form-actions">
                <Link className="button secondary" to={`/property/document/${property.id}`}>
                  View details
                </Link>
                <Link className="button secondary" to={`/property/update/${property.id}`}>
                  Edit
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
