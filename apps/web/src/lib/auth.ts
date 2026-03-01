export type SessionUser = {
  id: number;
  uuid: string;
  fullName: string;
  email: string;
  role: string;
  status: string;
  privileges: string[];
  phone?: string | null;
  nationality?: string | null;
  occupation?: string | null;
};

export type SessionState = {
  token: string;
  user: SessionUser;
};

const SESSION_KEY = 'ucc-pmp-session';
const TOKEN_KEY = 'ucc-pmp-token';

function notify() {
  window.dispatchEvent(new Event('ucc-pmp-session'));
}

export function getSession() {
  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) {
    return null;
  }

  return JSON.parse(raw) as SessionState;
}

export function setSession(session: SessionState) {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  window.localStorage.setItem(TOKEN_KEY, session.token);
  notify();
}

export function clearSession() {
  window.localStorage.removeItem(SESSION_KEY);
  window.localStorage.removeItem(TOKEN_KEY);
  notify();
}

export function useSessionSubscription(callback: () => void) {
  window.addEventListener('ucc-pmp-session', callback);
  return () => window.removeEventListener('ucc-pmp-session', callback);
}
