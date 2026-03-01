import { FormEvent, useState } from 'react';

import { apiRequest } from '../lib/api';
import { PageHeader } from '../components/PageHeader';

export function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage(null);

    try {
      await apiRequest('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMessage('Password changed successfully.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to change password');
    }
  }

  return (
    <>
      <PageHeader title="Change Password" subtitle="This replaces the Yii inline password validation flow." />
      <form className="surface" style={{ padding: '1.5rem' }} onSubmit={handleSubmit}>
        {message ? <div className="message error">{message}</div> : null}
        <div className="form-grid">
          <div className="field">
            <label htmlFor="currentPassword">Current password</label>
            <input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="newPassword">New password</label>
            <input id="newPassword" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="confirmPassword">Confirm password</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </div>
        </div>
        <div className="form-actions" style={{ marginTop: '1rem' }}>
          <button className="button primary" type="submit">
            Change Password
          </button>
        </div>
      </form>
    </>
  );
}
