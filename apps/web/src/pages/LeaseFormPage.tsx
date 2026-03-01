import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { apiRequest } from '../lib/api';
import { PageHeader } from '../components/PageHeader';

type LeaseFormPageProps = {
  mode: 'create' | 'renew';
};

type LeaseRecord = {
  id: number;
  propertyId: number;
  tenantId: number;
  property: { propertyName: string };
  tenant: { fullName: string };
};

type UserRecord = { id: number; fullName: string };
type PropertyRecord = { id: number; propertyName: string };
type PriceRecord = { id: number; unitAmount: number; period: string | null };
type ListSourceRecord = { id: number; listName: string; category: string; parentId: number | null };

export function LeaseFormPage({ mode }: LeaseFormPageProps) {
  const navigate = useNavigate();
  const params = useParams();
  const [form, setForm] = useState({
    propertyId: '',
    tenantId: '',
    propertyPriceId: '',
    statusId: '',
    leaseStartDate: '',
    leaseEndDate: '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const leases = useQuery({
    queryKey: ['lease-form-leases'],
    queryFn: () => apiRequest<LeaseRecord[]>('/leases'),
  });
  const properties = useQuery({
    queryKey: ['lease-properties'],
    queryFn: () => apiRequest<PropertyRecord[]>('/properties'),
  });
  const tenants = useQuery({
    queryKey: ['lease-tenants'],
    queryFn: () => apiRequest<UserRecord[]>('/users?filter=tenant'),
  });
  const listSources = useQuery({
    queryKey: ['lease-list-sources'],
    queryFn: () => apiRequest<ListSourceRecord[]>('/list-sources'),
  });
  const prices = useQuery({
    queryKey: ['lease-prices', form.propertyId],
    queryFn: () => apiRequest<PriceRecord[]>(`/property-prices/property/${form.propertyId}`),
    enabled: Boolean(form.propertyId),
  });

  const leaseStatuses = useMemo(() => {
    const parent = listSources.data?.find((item) => item.category === 'Lease Status' && item.parentId === null);
    return (listSources.data ?? []).filter((item) => item.parentId === parent?.id);
  }, [listSources.data]);

  useEffect(() => {
    if (mode === 'renew' && params.id && leases.data) {
      const current = leases.data.find((item) => String(item.id) === params.id);
      if (current) {
        setForm((previous) => ({
          ...previous,
          propertyId: String(current.propertyId),
          tenantId: String(current.tenantId),
        }));
      }
    }
  }, [leases.data, mode, params.id]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    try {
      const payload = {
        propertyId: Number(form.propertyId),
        tenantId: Number(form.tenantId),
        propertyPriceId: Number(form.propertyPriceId),
        statusId: Number(form.statusId),
        leaseStartDate: form.leaseStartDate,
        leaseEndDate: form.leaseEndDate,
      };

      const body = new FormData();
      body.append('payload', JSON.stringify(payload));
      if (file) {
        body.append('document', file);
      }

      await apiRequest(mode === 'create' ? '/leases' : `/leases/${params.id}/renew`, {
        method: 'POST',
        body,
        isFormData: true,
      });

      navigate('/custom/leases');
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Unable to save lease');
    }
  }

  const selectedLease = leases.data?.find((item) => String(item.id) === params.id);

  return (
    <>
      <PageHeader title={mode === 'create' ? 'Create Lease' : 'Renew Lease'} />
      <form className="surface" style={{ padding: '1.5rem' }} onSubmit={handleSubmit}>
        {error ? <div className="message error">{error}</div> : null}
        <div className="form-grid">
          <div className="field">
            <label htmlFor="propertyId">Property</label>
            {mode === 'renew' ? (
              <input id="propertyId" readOnly value={selectedLease?.property.propertyName ?? ''} />
            ) : (
              <select id="propertyId" value={form.propertyId} onChange={(event) => setForm((current) => ({ ...current, propertyId: event.target.value }))}>
                <option value="">Select Property</option>
                {(properties.data ?? []).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.propertyName}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="field">
            <label htmlFor="tenantId">Tenant</label>
            {mode === 'renew' ? (
              <input id="tenantId" readOnly value={selectedLease?.tenant.fullName ?? ''} />
            ) : (
              <select id="tenantId" value={form.tenantId} onChange={(event) => setForm((current) => ({ ...current, tenantId: event.target.value }))}>
                <option value="">Select Tenant</option>
                {(tenants.data ?? []).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.fullName}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="field">
            <label htmlFor="propertyPriceId">Property Price</label>
            <select id="propertyPriceId" value={form.propertyPriceId} onChange={(event) => setForm((current) => ({ ...current, propertyPriceId: event.target.value }))}>
              <option value="">Select Price</option>
              {(prices.data ?? []).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.unitAmount.toLocaleString()} {item.period ? `(${item.period})` : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="document">Lease Document</label>
            <input id="document" type="file" onChange={(event: ChangeEvent<HTMLInputElement>) => setFile(event.target.files?.[0] ?? null)} />
          </div>
          <div className="field">
            <label htmlFor="leaseStartDate">Lease Start Date</label>
            <input id="leaseStartDate" type="date" value={form.leaseStartDate} onChange={(event) => setForm((current) => ({ ...current, leaseStartDate: event.target.value }))} />
          </div>
          <div className="field">
            <label htmlFor="leaseEndDate">Lease End Date</label>
            <input id="leaseEndDate" type="date" value={form.leaseEndDate} onChange={(event) => setForm((current) => ({ ...current, leaseEndDate: event.target.value }))} />
          </div>
          <div className="field">
            <label htmlFor="statusId">Status</label>
            <select id="statusId" value={form.statusId} onChange={(event) => setForm((current) => ({ ...current, statusId: event.target.value }))}>
              <option value="">Select Status</option>
              {leaseStatuses.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.listName}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-actions" style={{ marginTop: '1rem' }}>
          <Link className="button secondary" to="/custom/leases">
            Back to Leases
          </Link>
          <button className="button primary" type="submit">
            {mode === 'create' ? 'Create Lease' : 'Renew Lease'}
          </button>
        </div>
      </form>
    </>
  );
}
