// FILE: src/router/user.routes.tsx (Finalized)

import { Route, Routes } from 'react-router-dom';
import { ProfilePage } from '../pages/dashboard/ProfilePage';
import { SettingsPage } from '../pages/dashboard/SettingsPage';
import { PageHeader } from '../components/common/PageHeader';

// Placeholder for the main dashboard page.
function DashboardHomePage() {
  return (
    <PageHeader 
      title="Welcome to your Dashboard"
      description="This is where your succession planning journey begins."
    />
  );
}

// All these routes will be nested inside a DashboardLayout component
// that includes the main navigation, sidebar, etc.

export function UserRoutes() {
  return (
    <Routes>
      <Route index element={<DashboardHomePage />} />
      <Route path="profile" element={<ProfilePage />} />
      <Route path="settings" element={<SettingsPage />} />
      {/* 
        Admin-only routes can be nested inside another ProtectedRoute for role checking.
        Example:
        <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
          <Route path="admin/users" element={<AdminUsersPage />} />
        </Route>
      */}
    </Routes>
  );
}