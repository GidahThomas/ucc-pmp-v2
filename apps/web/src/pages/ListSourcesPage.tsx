import { FormEvent, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiRequest } from '../lib/api';
import { DataTable } from '../components/DataTable';
import { PageHeader } from '../components/PageHeader';

type ListSource = {
  id: number;
  uuid: string;
  listName: string;
  category: string;
  code: string;
  description: string | null;
  parentId: number | null;
};

export function ListSourcesPage() {
  const [mode, setMode] = useState<'new' | 'child'>('new');
  const [form, setForm] = useState({ listName: '', category: '', description: '', parentId: '' });
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ['list-sources'],
    queryFn: () => apiRequest<ListSource[]>('/list-sources'),
  });

  const createSource = useMutation({
    mutationFn: () =>
      apiRequest('/list-sources', {
        method: 'POST',
        body: JSON.stringify({
          listName: form.listName,
          category: form.category,
          description: form.description,
          parentId: mode === 'child' && form.parentId ? Number(form.parentId) : null,
        }),
      }),
    onSuccess: () => {
      setForm({ listName: '', category: '', description: '', parentId: '' });
      void queryClient.invalidateQueries({ queryKey: ['list-sources'] });
    },
  });

  const parents = useMemo(() => (data ?? []).filter((item) => item.parentId === null), [data]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    createSource.mutate();
  }

  return (
    <>
      <PageHeader title="Configure List Source" subtitle="Add top-level and child configuration values." />
      <div className="segmented">
        <button type="button" className={mode === 'new' ? 'active' : ''} onClick={() => setMode('new')}>
          Add New List Name Configuration
        </button>
        <button type="button" className={mode === 'child' ? 'active' : ''} onClick={() => setMode('child')}>
          Add Configuration To Existing List Name
        </button>
      </div>
      <form className="surface" style={{ padding: '1.5rem' }} onSubmit={handleSubmit}>
        <div className="form-grid">
          {mode === 'child' ? (
            <div className="field">
              <label htmlFor="parentId">Parent list</label>
              <select id="parentId" value={form.parentId} onChange={(event) => setForm((current) => ({ ...current, parentId: event.target.value }))}>
                <option value="">Select Parent List</option>
                {parents.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.listName}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <div className="field">
            <label htmlFor="listName">List Name</label>
            <input id="listName" value={form.listName} onChange={(event) => setForm((current) => ({ ...current, listName: event.target.value }))} />
          </div>
          <div className="field">
            <label htmlFor="category">Category</label>
            <input id="category" value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} />
          </div>
          <div className="field">
            <label htmlFor="description">Description</label>
            <textarea id="description" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
          </div>
        </div>
        <div className="form-actions" style={{ marginTop: '1rem' }}>
          <button className="button primary" type="submit">
            Save
          </button>
        </div>
      </form>
      <DataTable
        rows={data ?? []}
        columns={[
          { header: 'ID', render: (row) => row.id },
          { header: 'UUID', render: (row) => row.uuid },
          { header: 'List Name', render: (row) => row.listName.toLowerCase() },
          { header: 'Code', render: (row) => row.code },
          { header: 'Category', render: (row) => row.category.toLowerCase() },
          { header: 'Parent ID', render: (row) => row.parentId ?? '-' },
          { header: 'Description', render: (row) => row.description ?? '-' },
        ]}
      />
    </>
  );
}
