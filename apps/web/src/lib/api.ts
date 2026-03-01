const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

type RequestOptions = RequestInit & {
  isFormData?: boolean;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}) {
  const token = window.localStorage.getItem('ucc-pmp-token');
  const headers = new Headers(options.headers);

  if (!options.isFormData) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as
      | { error?: { message?: string } }
      | null;
    throw new Error(errorBody?.error?.message ?? 'Request failed');
  }

  if (response.status === 204) {
    return null as T;
  }

  return (await response.json()) as T;
}
