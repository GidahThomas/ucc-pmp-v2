import { useQuery } from '@tanstack/react-query';

import { apiRequest } from '../lib/api';
import { PageHeader } from '../components/PageHeader';

type ProfileResponse = {
  fullName: string;
  email: string;
  role: string;
  phone?: string | null;
  nationality?: string | null;
  occupation?: string | null;
};

export function ProfilePage() {
  const { data } = useQuery({
    queryKey: ['profile'],
    queryFn: () => apiRequest<ProfileResponse>('/auth/me'),
  });

  return (
    <>
      <PageHeader title="My Profile" subtitle="Current authenticated account details." />
      <div className="surface" style={{ padding: '1.5rem' }}>
        <div className="form-grid">
          <div>
            <strong>Name</strong>
            <div>{data?.fullName ?? '-'}</div>
          </div>
          <div>
            <strong>Email</strong>
            <div>{data?.email ?? '-'}</div>
          </div>
          <div>
            <strong>Role</strong>
            <div>{data?.role ?? '-'}</div>
          </div>
          <div>
            <strong>Phone</strong>
            <div>{data?.phone ?? '-'}</div>
          </div>
          <div>
            <strong>Nationality</strong>
            <div>{data?.nationality ?? '-'}</div>
          </div>
          <div>
            <strong>Occupation</strong>
            <div>{data?.occupation ?? '-'}</div>
          </div>
        </div>
      </div>
    </>
  );
}
