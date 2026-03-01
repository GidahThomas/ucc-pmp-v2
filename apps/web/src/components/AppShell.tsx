import { Outlet, NavLink, useNavigate } from 'react-router-dom';

import { clearSession, getSession } from '../lib/auth';

const navigation = [
  { label: 'Dashboard', to: '/dashboard/admin-dash' },
  { label: 'Properties', to: '/property/index' },
  { label: 'Properties Prices', to: '/property-price/index' },
  { label: 'Lease management', to: '/custom/leases' },
  { label: 'Configuration', to: '/list-source/create' },
  { label: 'Property Extra data', to: '/property-attribute/create' },
  { label: 'Bills', to: '/custom/bill' },
  { label: 'Payments', to: '/custom/payment' },
  { label: 'User management', to: '/users/index' },
  { label: 'Locations', to: '/location/index' },
];

export function AppShell() {
  const navigate = useNavigate();
  const session = getSession();

  return (
    <div className="portal-shell">
      <aside className="portal-sidebar">
        <div className="portal-logo">PMP</div>
        <nav className="portal-nav">
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? 'active' : undefined)}
            >
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="portal-main">
        <header className="portal-header">
          <div>
            <strong>{session?.user.fullName ?? 'Guest'}</strong>
            <div style={{ color: 'var(--text-secondary)' }}>{session?.user.role ?? 'unknown'}</div>
          </div>
          <div className="segmented">
            <button
              type="button"
              onClick={() => {
                navigate('/custom/profile');
              }}
            >
              Profile
            </button>
            <button
              type="button"
              onClick={() => {
                clearSession();
                navigate('/login/login');
              }}
            >
              Logout
            </button>
          </div>
        </header>
        <section className="portal-content">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
