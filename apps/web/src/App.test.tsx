// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';

import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import App from './App';
import { queryClient } from './lib/query-client';

const mockFetch = vi.fn();

vi.stubGlobal('fetch', mockFetch);

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response;
}

beforeEach(() => {
  queryClient.clear();
  window.localStorage.clear();
  mockFetch.mockReset();
});

afterEach(() => {
  cleanup();
});

describe('web smoke tests', () => {
  it('redirects protected routes to the login page', async () => {
    renderAt('/property/index');

    expect(await screen.findByRole('heading', { name: 'Login' })).toBeInTheDocument();
  });

  it('submits the login form and navigates to the dashboard', async () => {
    mockFetch
      .mockResolvedValueOnce(
        jsonResponse({
          token: 'token-123',
          user: {
            id: 1,
            uuid: 'User_1',
            fullName: 'System Admin',
            email: 'admin@ucc-pmp.local',
            role: 'admin',
            status: 'active',
            privileges: ['manage'],
          },
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          totalProperties: 2,
          usageCounts: [],
          analytics: [],
          translationReport: [],
        }),
      );

    const user = userEvent.setup();
    renderAt('/login/login');

    await user.type(screen.getByLabelText('Username'), 'admin@ucc-pmp.local');
    await user.type(screen.getByLabelText('Password'), 'Admin@123');
    await user.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => {
      expect(window.localStorage.getItem('ucc-pmp-token')).toBe('token-123');
    });

    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
  });

  it('shows API error messages on failed login attempts', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse(
        {
          error: {
            message: 'Incorrect username or password',
          },
        },
        401,
      ),
    );

    const user = userEvent.setup();
    renderAt('/login/login');

    await user.type(screen.getByLabelText('Username'), 'admin@ucc-pmp.local');
    await user.type(screen.getByLabelText('Password'), 'WrongPassword@123');
    await user.click(screen.getByRole('button', { name: 'Login' }));

    expect(await screen.findByText('Incorrect username or password')).toBeInTheDocument();
  });
});
