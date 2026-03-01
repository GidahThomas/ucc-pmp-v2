import { FormEvent, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { apiRequest } from '../lib/api';
import { setSession } from '../lib/auth';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const session = await apiRequest<{
        token: string;
        user: {
          id: number;
          uuid: string;
          fullName: string;
          email: string;
          role: string;
          status: string;
          privileges: string[];
        };
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password, rememberMe }),
      });

      setSession(session);
      const nextPath = (location.state as { from?: string } | null)?.from ?? '/dashboard/admin-dash';
      navigate(nextPath, { replace: true });
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '1.5rem',
      }}
    >
      <form className="surface" style={{ width: '100%', maxWidth: '440px', padding: '2rem' }} onSubmit={handleSubmit}>
        <h1 style={{ marginTop: 0 }}>Login</h1>
        <p className="page-subtitle">Use full name or email with the seeded password for local access.</p>
        {error ? <div className="message error">{error}</div> : null}
        <div className="field" style={{ marginTop: '1rem' }}>
          <label htmlFor="username">Username</label>
          <input id="username" value={username} onChange={(event) => setUsername(event.target.value)} />
        </div>
        <div className="field" style={{ marginTop: '1rem' }}>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        <label style={{ display: 'flex', gap: '0.5rem', margin: '1rem 0 1.5rem' }}>
          <input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} />
          <span>Remember me</span>
        </label>
        <button className="button primary" type="submit" disabled={submitting}>
          {submitting ? 'Signing in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}
