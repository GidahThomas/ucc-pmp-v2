import { FormEvent, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiRequest } from '../lib/api';
import { DataTable } from '../components/DataTable';
import { PageHeader } from '../components/PageHeader';

type GeographyEntity = 'countries' | 'regions' | 'districts' | 'streets' | 'locations' | 'property-locations';

type GeographyPageProps = {
  entity: GeographyEntity;
};

export function GeographyPage({ entity }: GeographyPageProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Record<string, string>>({});
  const { data } = useQuery({
    queryKey: ['geography', entity],
    queryFn: () => apiRequest<any[]>(`/geography/${entity}`),
  });
  const countries = useQuery({ queryKey: ['countries'], queryFn: () => apiRequest<any[]>('/geography/countries') });
  const regions = useQuery({ queryKey: ['regions'], queryFn: () => apiRequest<any[]>('/geography/regions') });
  const districts = useQuery({ queryKey: ['districts'], queryFn: () => apiRequest<any[]>('/geography/districts') });
  const streets = useQuery({ queryKey: ['streets'], queryFn: () => apiRequest<any[]>('/geography/streets') });
  const properties = useQuery({ queryKey: ['properties-minimal'], queryFn: () => apiRequest<any[]>('/properties') });
  const listSources = useQuery({ queryKey: ['list-sources-minimal'], queryFn: () => apiRequest<any[]>('/list-sources') });

  const pageTitle = useMemo(() => {
    switch (entity) {
      case 'countries':
        return 'Countries';
      case 'regions':
        return 'Regions';
      case 'districts':
        return 'Districts';
      case 'streets':
        return 'Streets';
      case 'locations':
        return 'Locations';
      default:
        return 'Property Locations';
    }
  }, [entity]);

  const createMutation = useMutation({
    mutationFn: () => {
      const payload =
        entity === 'countries'
          ? { countryName: form.countryName ?? '' }
          : entity === 'regions'
            ? { name: form.name ?? '', countryId: Number(form.countryId) }
            : entity === 'districts'
              ? { districtName: form.districtName ?? '', regionId: Number(form.regionId) }
              : entity === 'streets'
                ? { streetName: form.streetName ?? '', regionId: Number(form.regionId), districtId: Number(form.districtId) }
                : entity === 'locations'
                  ? {
                      countryId: Number(form.countryId),
                      regionId: Number(form.regionId),
                      districtId: Number(form.districtId),
                      streetId: Number(form.streetId),
                    }
                  : {
                      propertyId: form.propertyId ? Number(form.propertyId) : null,
                      locationId: form.locationId ? Number(form.locationId) : null,
                      statusId: form.statusId ? Number(form.statusId) : null,
                    };

      return apiRequest(`/geography/${entity}`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      setForm({});
      void queryClient.invalidateQueries({ queryKey: ['geography', entity] });
    },
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    createMutation.mutate();
  }

  return (
    <>
      <PageHeader title={pageTitle} subtitle="CRUD translation of the Yii geography modules." />
      <form className="surface" style={{ padding: '1.5rem' }} onSubmit={handleSubmit}>
        <div className="form-grid">
          {entity === 'countries' ? (
            <div className="field">
              <label htmlFor="countryName">Country Name</label>
              <input id="countryName" value={form.countryName ?? ''} onChange={(event) => setForm((current) => ({ ...current, countryName: event.target.value }))} />
            </div>
          ) : null}
          {entity === 'regions' ? (
            <>
              <div className="field">
                <label htmlFor="name">Region Name</label>
                <input id="name" value={form.name ?? ''} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
              </div>
              <div className="field">
                <label htmlFor="countryId">Country</label>
                <select id="countryId" value={form.countryId ?? ''} onChange={(event) => setForm((current) => ({ ...current, countryId: event.target.value }))}>
                  <option value="">Select Country</option>
                  {(countries.data ?? []).map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.countryName}
                    </option>
                  ))}
                </select>
              </div>
            </>
          ) : null}
          {entity === 'districts' ? (
            <>
              <div className="field">
                <label htmlFor="districtName">District Name</label>
                <input id="districtName" value={form.districtName ?? ''} onChange={(event) => setForm((current) => ({ ...current, districtName: event.target.value }))} />
              </div>
              <div className="field">
                <label htmlFor="regionId">Region</label>
                <select id="regionId" value={form.regionId ?? ''} onChange={(event) => setForm((current) => ({ ...current, regionId: event.target.value }))}>
                  <option value="">Select Region</option>
                  {(regions.data ?? []).map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          ) : null}
          {entity === 'streets' ? (
            <>
              <div className="field">
                <label htmlFor="streetName">Street Name</label>
                <input id="streetName" value={form.streetName ?? ''} onChange={(event) => setForm((current) => ({ ...current, streetName: event.target.value }))} />
              </div>
              <div className="field">
                <label htmlFor="regionId">Region</label>
                <select id="regionId" value={form.regionId ?? ''} onChange={(event) => setForm((current) => ({ ...current, regionId: event.target.value }))}>
                  <option value="">Select Region</option>
                  {(regions.data ?? []).map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="districtId">District</label>
                <select id="districtId" value={form.districtId ?? ''} onChange={(event) => setForm((current) => ({ ...current, districtId: event.target.value }))}>
                  <option value="">Select District</option>
                  {(districts.data ?? []).map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.districtName}
                    </option>
                  ))}
                </select>
              </div>
            </>
          ) : null}
          {entity === 'locations' ? (
            <>
              {['countryId', 'regionId', 'districtId', 'streetId'].map((field) => (
                <div key={field} className="field">
                  <label htmlFor={field}>{field}</label>
                  <select id={field} value={form[field] ?? ''} onChange={(event) => setForm((current) => ({ ...current, [field]: event.target.value }))}>
                    <option value="">Select {field}</option>
                    {(field === 'countryId' ? countries.data : field === 'regionId' ? regions.data : field === 'districtId' ? districts.data : streets.data)?.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.countryName ?? item.name ?? item.districtName ?? item.streetName}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </>
          ) : null}
          {entity === 'property-locations' ? (
            <>
              <div className="field">
                <label htmlFor="propertyId">Property</label>
                <select id="propertyId" value={form.propertyId ?? ''} onChange={(event) => setForm((current) => ({ ...current, propertyId: event.target.value }))}>
                  <option value="">Select Property</option>
                  {(properties.data ?? []).map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.propertyName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="locationId">Location</label>
                <select id="locationId" value={form.locationId ?? ''} onChange={(event) => setForm((current) => ({ ...current, locationId: event.target.value }))}>
                  <option value="">Select Location</option>
                  {(data ?? []).map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.id}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="statusId">Status</label>
                <select id="statusId" value={form.statusId ?? ''} onChange={(event) => setForm((current) => ({ ...current, statusId: event.target.value }))}>
                  <option value="">Select Status</option>
                  {(listSources.data ?? []).map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.listName}
                    </option>
                  ))}
                </select>
              </div>
            </>
          ) : null}
        </div>
        <div className="form-actions" style={{ marginTop: '1rem' }}>
          <button className="button primary" type="submit">
            Save
          </button>
        </div>
      </form>
      <DataTable
        rows={data ?? []}
        columns={Object.keys((data ?? [])[0] ?? { id: 'id' }).slice(0, 6).map((key) => ({
          header: key,
          render: (row: Record<string, unknown>) => String(row[key] ?? '-'),
        }))}
      />
    </>
  );
}
