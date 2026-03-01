import { QueryClientProvider } from '@tanstack/react-query';
import { Navigate, Route, Routes } from 'react-router-dom';

import { AppShell } from './components/AppShell';
import { ProtectedRoute } from './components/ProtectedRoute';
import { queryClient } from './lib/query-client';
import { BillsPage } from './pages/BillsPage';
import { ChangePasswordPage } from './pages/ChangePasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { GeographyPage } from './pages/GeographyPage';
import { LeaseFormPage } from './pages/LeaseFormPage';
import { LeaseListPage } from './pages/LeaseListPage';
import { ListSourcesPage } from './pages/ListSourcesPage';
import { LoginPage } from './pages/LoginPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { ProfilePage } from './pages/ProfilePage';
import { PropertyAttributesPage } from './pages/PropertyAttributesPage';
import { PropertyDocumentPage } from './pages/PropertyDocumentPage';
import { PropertyFormPage } from './pages/PropertyFormPage';
import { PropertyListPage } from './pages/PropertyListPage';
import { PropertyPriceFormPage } from './pages/PropertyPriceFormPage';
import { PropertyPriceListPage } from './pages/PropertyPriceListPage';
import { TenantLeasePage } from './pages/TenantLeasePage';
import { UserFormPage } from './pages/UserFormPage';
import { UsersPage } from './pages/UsersPage';

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard/admin-dash" replace />} />
        <Route path="/login" element={<Navigate to="/login/login" replace />} />
        <Route path="/login/index" element={<LoginPage />} />
        <Route path="/login/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/dashboard/admin-dash" element={<DashboardPage />} />
            <Route path="/property/index" element={<PropertyListPage />} />
            <Route path="/property/create" element={<PropertyFormPage mode="create" />} />
            <Route path="/property/update/:id" element={<PropertyFormPage mode="edit" />} />
            <Route path="/property/document/:id" element={<PropertyDocumentPage />} />
            <Route path="/property-price/index" element={<PropertyPriceListPage />} />
            <Route path="/property-price/save" element={<PropertyPriceFormPage />} />
            <Route path="/property-price/save/:id" element={<PropertyPriceFormPage />} />
            <Route path="/custom/leases" element={<LeaseListPage />} />
            <Route path="/custom/create-lease" element={<LeaseFormPage mode="create" />} />
            <Route path="/custom/renew/:id" element={<LeaseFormPage mode="renew" />} />
            <Route path="/custom/view-lease/:id" element={<TenantLeasePage />} />
            <Route path="/custom/bill" element={<BillsPage />} />
            <Route path="/custom/payment" element={<PaymentsPage />} />
            <Route path="/custom/change-password" element={<ChangePasswordPage />} />
            <Route path="/custom/profile" element={<ProfilePage />} />
            <Route path="/users/index" element={<UsersPage />} />
            <Route path="/users/create" element={<UserFormPage mode="create" />} />
            <Route path="/users/update/:id" element={<UserFormPage mode="edit" />} />
            <Route path="/list-source/create" element={<ListSourcesPage />} />
            <Route path="/property-attribute/create" element={<PropertyAttributesPage />} />
            <Route path="/country/index" element={<GeographyPage entity="countries" />} />
            <Route path="/region/index" element={<GeographyPage entity="regions" />} />
            <Route path="/district/index" element={<GeographyPage entity="districts" />} />
            <Route path="/street/index" element={<GeographyPage entity="streets" />} />
            <Route path="/location/index" element={<GeographyPage entity="locations" />} />
            <Route path="/property-location/index" element={<GeographyPage entity="property-locations" />} />
          </Route>
        </Route>
      </Routes>
    </QueryClientProvider>
  );
}
