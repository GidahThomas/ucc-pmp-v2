import { FormEvent, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiRequest } from '../lib/api';
import { DataTable } from '../components/DataTable';
import { PageHeader } from '../components/PageHeader';

type ListSource = {
  id: number;
  listName: string;
  category: string;
  parentId: number | null;
};

type AttributeRecord = {
  id: number;
  attributeName: string;
  attributeDatatype: string;
  propertyTypeName: string | null;
};

export function PropertyAttributesPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ propertyTypeId: '', attributeName: '', attributeDataTypeId: '' });
  const { data: listSources } = useQuery({
    queryKey: ['attribute-list-sources'],
    queryFn: () => apiRequest<ListSource[]>('/list-sources'),
  });
  const { data: attributes } = useQuery({
    queryKey: ['property-attributes'],
    queryFn: () => apiRequest<AttributeRecord[]>('/property-attributes'),
  });

  const propertyTypes = useMemo(() => {
    const parent = listSources?.find((item) => item.category === 'Property Type' && item.parentId === null);
    return (listSources ?? []).filter((item) => item.parentId === parent?.id);
  }, [listSources]);

  const dataTypes = useMemo(() => {
    const parent = listSources?.find((item) => item.category === 'Data Type' && item.parentId === null);
    return (listSources ?? []).filter((item) => item.parentId === parent?.id);
  }, [listSources]);

  const createAttribute = useMutation({
    mutationFn: () =>
      apiRequest('/property-attributes', {
        method: 'POST',
        body: JSON.stringify({
          propertyTypeId: form.propertyTypeId ? Number(form.propertyTypeId) : null,
          attributeName: form.attributeName,
          attributeDataTypeId: Number(form.attributeDataTypeId),
        }),
      }),
    onSuccess: () => {
      setForm({ propertyTypeId: '', attributeName: '', attributeDataTypeId: '' });
      void queryClient.invalidateQueries({ queryKey: ['property-attributes'] });
    },
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    createAttribute.mutate();
  }

  return (
    <>
      <PageHeader title="Configure Extra Data" subtitle="Add dynamic property attributes tied to property type and data type." />
      <form className="surface" style={{ padding: '1.5rem' }} onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="propertyTypeId">Property Type</label>
            <select id="propertyTypeId" value={form.propertyTypeId} onChange={(event) => setForm((current) => ({ ...current, propertyTypeId: event.target.value }))}>
              <option value="">Select The Property Type</option>
              {propertyTypes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.listName}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="attributeName">Attribute Name</label>
            <input id="attributeName" value={form.attributeName} onChange={(event) => setForm((current) => ({ ...current, attributeName: event.target.value }))} />
          </div>
          <div className="field">
            <label htmlFor="attributeDataTypeId">Data Type</label>
            <select id="attributeDataTypeId" value={form.attributeDataTypeId} onChange={(event) => setForm((current) => ({ ...current, attributeDataTypeId: event.target.value }))}>
              <option value="">Select Data type</option>
              {dataTypes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.listName}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-actions" style={{ marginTop: '1rem' }}>
          <button className="button primary" type="submit">
            Save
          </button>
        </div>
      </form>
      <DataTable
        rows={attributes ?? []}
        columns={[
          { header: 'Attribute', render: (row) => row.attributeName },
          { header: 'Data Type', render: (row) => row.attributeDatatype },
          { header: 'Property Type', render: (row) => row.propertyTypeName ?? '-' },
        ]}
      />
    </>
  );
}
