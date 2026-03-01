import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { apiRequest } from '../lib/api';
import { PageHeader } from '../components/PageHeader';

type PropertyFormPageProps = {
  mode: 'create' | 'edit';
};

type MetadataResponse = {
  propertyTypes: { id: number; listName: string }[];
  ownershipTypes: { id: number; listName: string }[];
  propertyStatuses: { id: number; listName: string }[];
  usageTypes: { id: number; listName: string }[];
  streets: { id: number; streetName: string }[];
};

type AttributeRecord = {
  id: number;
  attributeName: string;
  attributeDatatype: string;
  options: { id: number; listName: string }[];
};

type PropertyDetail = {
  propertyName: string;
  propertyTypeId: number;
  propertyStatusId: number;
  ownershipTypeId: number;
  usageTypeId: number;
  streetId: number | null;
  identifierCode: string;
  description: string | null;
  extraData: {
    propertyAttributeId: number;
    attributeAnswerId: number | null;
    attributeAnswerText: string | null;
  }[];
};

type PropertyFormState = {
  propertyName: string;
  propertyTypeId: string;
  ownershipTypeId: string;
  propertyStatusId: string;
  usageTypeId: string;
  streetId: string;
  identifierCode: string;
  description: string;
};

type ExtraDataState = Record<number, { text?: string; answerId?: number }>;

export function PropertyFormPage({ mode }: PropertyFormPageProps) {
  const navigate = useNavigate();
  const params = useParams();
  const [form, setForm] = useState<PropertyFormState>({
    propertyName: '',
    propertyTypeId: '',
    ownershipTypeId: '',
    propertyStatusId: '',
    usageTypeId: '',
    streetId: '',
    identifierCode: '',
    description: '',
  });
  const [extraData, setExtraData] = useState<ExtraDataState>({});
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: metadata } = useQuery({
    queryKey: ['property-metadata'],
    queryFn: () => apiRequest<MetadataResponse>('/properties/metadata'),
  });

  const { data: property } = useQuery({
    queryKey: ['property-edit', params.id],
    queryFn: () => apiRequest<PropertyDetail>(`/properties/${params.id}`),
    enabled: mode === 'edit' && Boolean(params.id),
  });

  const { data: attributes } = useQuery({
    queryKey: ['property-attributes-by-type', form.propertyTypeId],
    queryFn: () => apiRequest<AttributeRecord[]>(`/property-attributes?propertyTypeId=${form.propertyTypeId}`),
    enabled: Boolean(form.propertyTypeId),
  });

  useEffect(() => {
    if (property && mode === 'edit') {
      setForm({
        propertyName: property.propertyName,
        propertyTypeId: String(property.propertyTypeId),
        ownershipTypeId: String(property.ownershipTypeId),
        propertyStatusId: String(property.propertyStatusId),
        usageTypeId: String(property.usageTypeId),
        streetId: property.streetId ? String(property.streetId) : '',
        identifierCode: property.identifierCode,
        description: property.description ?? '',
      });

      setExtraData(
        Object.fromEntries(
          property.extraData.map((item) => [
            item.propertyAttributeId,
            {
              text: item.attributeAnswerText ?? undefined,
              answerId: item.attributeAnswerId ?? undefined,
            },
          ]),
        ),
      );
    }
  }, [mode, property]);

  const normalizedExtraData = useMemo(
    () =>
      Object.entries(extraData).flatMap(([attributeId, value]) => {
        if (!value.text && !value.answerId) {
          return [];
        }

        return [
          {
            propertyAttributeId: Number(attributeId),
            attributeAnswerText: value.text ?? null,
            attributeAnswerId: value.answerId ?? null,
          },
        ];
      }),
    [extraData],
  );

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    try {
      const payload = {
        propertyName: form.propertyName,
        propertyTypeId: Number(form.propertyTypeId),
        ownershipTypeId: Number(form.ownershipTypeId),
        propertyStatusId: Number(form.propertyStatusId),
        usageTypeId: Number(form.usageTypeId),
        streetId: form.streetId ? Number(form.streetId) : null,
        identifierCode: form.identifierCode,
        description: form.description,
        extraData: normalizedExtraData,
      };

      const body = new FormData();
      body.append('payload', JSON.stringify(payload));
      if (file) {
        body.append('document', file);
      }

      await apiRequest(mode === 'create' ? '/properties' : `/properties/${params.id}`, {
        method: mode === 'create' ? 'POST' : 'PUT',
        body,
        isFormData: true,
      });

      navigate('/property/index');
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Unable to save property');
    }
  }

  return (
    <>
      <PageHeader title={mode === 'create' ? 'Add new property' : 'Update property'} />
      <form className="surface" style={{ padding: '1.5rem' }} onSubmit={handleSubmit}>
        {error ? <div className="message error">{error}</div> : null}
        <div className="form-grid">
          <div className="field">
            <label htmlFor="propertyName">Property Name</label>
            <input id="propertyName" value={form.propertyName} onChange={(event) => setForm((current) => ({ ...current, propertyName: event.target.value }))} />
          </div>
          <div className="field">
            <label htmlFor="propertyTypeId">Property Type</label>
            <select id="propertyTypeId" value={form.propertyTypeId} onChange={(event) => setForm((current) => ({ ...current, propertyTypeId: event.target.value }))}>
              <option value="">Property Type</option>
              {(metadata?.propertyTypes ?? []).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.listName}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="ownershipTypeId">Ownership Type</label>
            <select id="ownershipTypeId" value={form.ownershipTypeId} onChange={(event) => setForm((current) => ({ ...current, ownershipTypeId: event.target.value }))}>
              <option value="">Ownership Type</option>
              {(metadata?.ownershipTypes ?? []).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.listName}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="propertyStatusId">Status</label>
            <select id="propertyStatusId" value={form.propertyStatusId} onChange={(event) => setForm((current) => ({ ...current, propertyStatusId: event.target.value }))}>
              <option value="">Status</option>
              {(metadata?.propertyStatuses ?? []).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.listName}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="usageTypeId">Usage Type</label>
            <select id="usageTypeId" value={form.usageTypeId} onChange={(event) => setForm((current) => ({ ...current, usageTypeId: event.target.value }))}>
              <option value="">Usage Type</option>
              {(metadata?.usageTypes ?? []).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.listName}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="streetId">Location</label>
            <select id="streetId" value={form.streetId} onChange={(event) => setForm((current) => ({ ...current, streetId: event.target.value }))}>
              <option value="">Location</option>
              {(metadata?.streets ?? []).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.streetName}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="identifierCode">Unique Property Identity</label>
            <input id="identifierCode" value={form.identifierCode} onChange={(event) => setForm((current) => ({ ...current, identifierCode: event.target.value }))} />
          </div>
          <div className="field">
            <label htmlFor="document">Document</label>
            <input id="document" type="file" onChange={(event: ChangeEvent<HTMLInputElement>) => setFile(event.target.files?.[0] ?? null)} />
          </div>
          <div className="field" style={{ gridColumn: '1 / -1' }}>
            <label htmlFor="description">Description</label>
            <textarea id="description" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
          </div>
        </div>
        <div style={{ marginTop: '1rem' }}>
          <h3>Additional Attributes</h3>
          <div className="form-grid">
            {(attributes ?? []).map((attribute) => (
              <div key={attribute.id} className="field">
                <label htmlFor={`attribute-${attribute.id}`}>{attribute.attributeName}</label>
                {attribute.attributeDatatype === 'select' || attribute.attributeDatatype === 'boolean' ? (
                  <select
                    id={`attribute-${attribute.id}`}
                    value={extraData[attribute.id]?.answerId ?? ''}
                    onChange={(event) =>
                      setExtraData((current) => ({
                        ...current,
                        [attribute.id]: { answerId: event.target.value ? Number(event.target.value) : undefined },
                      }))
                    }
                  >
                    <option value="">Select</option>
                    {attribute.options.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.listName}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id={`attribute-${attribute.id}`}
                    type={attribute.attributeDatatype === 'number' ? 'number' : 'text'}
                    value={extraData[attribute.id]?.text ?? ''}
                    onChange={(event) =>
                      setExtraData((current) => ({
                        ...current,
                        [attribute.id]: { text: event.target.value },
                      }))
                    }
                  />
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="form-actions" style={{ marginTop: '1rem' }}>
          <Link className="button secondary" to="/property/index">
            Cancel
          </Link>
          <button className="button primary" type="submit">
            Save
          </button>
        </div>
      </form>
    </>
  );
}
