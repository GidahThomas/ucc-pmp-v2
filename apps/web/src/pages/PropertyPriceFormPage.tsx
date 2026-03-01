import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { apiRequest } from '../lib/api';
import { PageHeader } from '../components/PageHeader';

type PriceRecord = {
  id: number;
  propertyId: number;
  priceTypeId: number;
  unitAmount: number;
  period: string | null;
  minMonthlyRent: number | null;
  maxMonthlyRent: number | null;
};

type PropertyRecord = { id: number; propertyName: string };
type ListSourceRecord = { id: number; listName: string; category: string; parentId: number | null };

export function PropertyPriceFormPage() {
  const navigate = useNavigate();
  const params = useParams();
  const [form, setForm] = useState({
    propertyId: '',
    priceTypeId: '',
    unitAmount: '',
    period: 'Monthly',
    minMonthlyRent: '',
    maxMonthlyRent: '',
  });
  const [error, setError] = useState<string | null>(null);

  const prices = useQuery({
    queryKey: ['prices-all'],
    queryFn: () => apiRequest<PriceRecord[]>('/property-prices'),
  });
  const properties = useQuery({
    queryKey: ['properties-minimal-for-prices'],
    queryFn: () => apiRequest<PropertyRecord[]>('/properties'),
  });
  const listSources = useQuery({
    queryKey: ['price-list-sources'],
    queryFn: () => apiRequest<ListSourceRecord[]>('/list-sources'),
  });

  const priceTypes = useMemo(() => {
    const parent = listSources.data?.find((item) => item.category === 'Usage Type' && item.parentId === null);
    return (listSources.data ?? []).filter((item) => item.parentId === parent?.id);
  }, [listSources.data]);

  useEffect(() => {
    const current = prices.data?.find((item) => String(item.id) === params.id);
    if (current) {
      setForm({
        propertyId: String(current.propertyId),
        priceTypeId: String(current.priceTypeId),
        unitAmount: String(current.unitAmount),
        period: current.period ?? 'Monthly',
        minMonthlyRent: current.minMonthlyRent ? String(current.minMonthlyRent) : '',
        maxMonthlyRent: current.maxMonthlyRent ? String(current.maxMonthlyRent) : '',
      });
    }
  }, [params.id, prices.data]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    try {
      await apiRequest(params.id ? `/property-prices/${params.id}` : '/property-prices', {
        method: params.id ? 'PUT' : 'POST',
        body: JSON.stringify({
          propertyId: Number(form.propertyId),
          priceTypeId: Number(form.priceTypeId),
          unitAmount: Number(form.unitAmount),
          period: form.period,
          minMonthlyRent: form.minMonthlyRent ? Number(form.minMonthlyRent) : null,
          maxMonthlyRent: form.maxMonthlyRent ? Number(form.maxMonthlyRent) : null,
        }),
      });

      navigate('/property-price/index');
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Unable to save property price');
    }
  }

  return (
    <>
      <PageHeader title={params.id ? 'Update Price' : 'Add Property Price'} />
      <form className="surface" style={{ padding: '1.5rem' }} onSubmit={handleSubmit}>
        {error ? <div className="message error">{error}</div> : null}
        <div className="form-grid">
          <div className="field">
            <label htmlFor="propertyId">Property</label>
            <select id="propertyId" value={form.propertyId} onChange={(event) => setForm((current) => ({ ...current, propertyId: event.target.value }))}>
              <option value="">Select Property</option>
              {(properties.data ?? []).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.propertyName}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="priceTypeId">Price Type</label>
            <select id="priceTypeId" value={form.priceTypeId} onChange={(event) => setForm((current) => ({ ...current, priceTypeId: event.target.value }))}>
              <option value="">Select Price Type</option>
              {priceTypes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.listName}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="unitAmount">Unit Amount</label>
            <input id="unitAmount" type="number" value={form.unitAmount} onChange={(event) => setForm((current) => ({ ...current, unitAmount: event.target.value }))} />
          </div>
          <div className="field">
            <label htmlFor="period">Period</label>
            <select id="period" value={form.period} onChange={(event) => setForm((current) => ({ ...current, period: event.target.value }))}>
              <option value="Monthly">Monthly</option>
              <option value="Yearly">Yearly</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="minMonthlyRent">Min Monthly Rent</label>
            <input id="minMonthlyRent" type="number" value={form.minMonthlyRent} onChange={(event) => setForm((current) => ({ ...current, minMonthlyRent: event.target.value }))} />
          </div>
          <div className="field">
            <label htmlFor="maxMonthlyRent">Max Monthly Rent</label>
            <input id="maxMonthlyRent" type="number" value={form.maxMonthlyRent} onChange={(event) => setForm((current) => ({ ...current, maxMonthlyRent: event.target.value }))} />
          </div>
        </div>
        <div className="form-actions" style={{ marginTop: '1rem' }}>
          <Link className="button secondary" to="/property-price/index">
            Back to Property Prices
          </Link>
          <button className="button primary" type="submit">
            {params.id ? 'Update Price' : 'Add Price'}
          </button>
        </div>
      </form>
    </>
  );
}
