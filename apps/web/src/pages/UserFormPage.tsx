import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { apiRequest } from '../lib/api';
import { PageHeader } from '../components/PageHeader';

type UserFormPageProps = {
  mode: 'create' | 'edit';
};

type UserRecord = {
  id: number;
  fullName: string;
  email: string;
  phone?: string | null;
  nationalId?: string | null;
  nationality?: string | null;
  occupation?: string | null;
  role: string;
  status: string;
  privileges?: string[];
};

type UserFormState = {
  fullName: string;
  email: string;
  phone: string;
  nationalId: string;
  nationality: string;
  occupation: string;
  role: string;
  status: string;
  password: string;
  privileges: string[];
};

const defaultState: UserFormState = {
  fullName: '',
  email: '',
  phone: '',
  nationalId: '',
  nationality: '',
  occupation: '',
  role: 'tenant',
  status: 'active',
  password: '',
  privileges: [],
};

const privilegeOptions = ['create', 'edit', 'delete', 'assign', 'view', 'manage'];

export function UserFormPage({ mode }: UserFormPageProps) {
  const navigate = useNavigate();
  const params = useParams();
  const [form, setForm] = useState<UserFormState>(defaultState);
  const [error, setError] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ['user-form-users'],
    queryFn: () => apiRequest<UserRecord[]>('/users?filter=all'),
    enabled: mode === 'edit',
  });

  useEffect(() => {
    if (mode === 'edit' && data && params.id) {
      const current = data.find((item) => String(item.id) === params.id);
      if (current) {
        setForm({
          fullName: current.fullName,
          email: current.email,
          phone: current.phone ?? '',
          nationalId: current.nationalId ?? '',
          nationality: current.nationality ?? '',
          occupation: current.occupation ?? '',
          role: current.role,
          status: current.status,
          password: '',
          privileges: current.privileges ?? [],
        });
      }
    }
  }, [data, mode, params.id]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    try {
      await apiRequest(mode === 'create' ? '/users' : `/users/${params.id}`, {
        method: mode === 'create' ? 'POST' : 'PUT',
        body: JSON.stringify(form),
      });

      navigate('/users/index');
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Unable to save user');
    }
  }

  return (
    <>
      <PageHeader title={mode === 'create' ? 'Add New User' : 'Update User'} />
      <form className="surface" style={{ padding: '1.5rem' }} onSubmit={handleSubmit}>
        {error ? <div className="message error">{error}</div> : null}
        <div className="form-grid">
          {(
            [
              ['fullName', 'Full Name'],
              ['email', 'Email'],
              ['phone', 'Phone'],
              ['nationalId', 'National ID'],
              ['nationality', 'Nationality'],
              ['occupation', 'Occupation'],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="field">
              <label htmlFor={key}>{label}</label>
              <input id={key} value={form[key]} onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))} />
            </div>
          ))}
          <div className="field">
            <label htmlFor="role">Role</label>
            <select id="role" value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}>
              <option value="tenant">tenant</option>
              <option value="manager">manager</option>
              <option value="admin">admin</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="status">Status</label>
            <select id="status" value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}>
              <option value="active">active</option>
              <option value="inactive">inactive</option>
              <option value="blocked">blocked</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} />
          </div>
        </div>
        <div style={{ marginTop: '1rem' }}>
          <strong>Privileges</strong>
          <div className="form-grid" style={{ marginTop: '0.75rem' }}>
            {privilegeOptions.map((privilege) => (
              <label key={privilege} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={form.privileges.includes(privilege)}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      privileges: event.target.checked
                        ? [...current.privileges, privilege]
                        : current.privileges.filter((item) => item !== privilege),
                    }))
                  }
                />
                <span>{privilege}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="form-actions" style={{ marginTop: '1rem' }}>
          <button className="button primary" type="submit">
            Save
          </button>
        </div>
      </form>
    </>
  );
}
