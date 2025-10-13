// FILE: src/router/user.routes.tsx

import { Route, Routes } from 'react-router-dom';

// UPGRADE: Import the final page components from their correct locations
import { DashboardHomePage } from '../pages/DashboardHomePage';
import { ProfilePage } from '../pages/users/ProfilePage';
import { SettingsPage } from '../pages/users/SettingsPage';

/**
 * UserRoutes - Defines the core, user-facing routes within the dashboard.
 * This component is intended for nesting within a protected layout.
 */
export function UserRoutes() {
  return (
    <Routes>
      <Route index element={<DashboardHomePage />} />
      <Route path="profile" element={<ProfilePage />} />
      <Route path="settings" element={<SettingsPage />} />
    </Routes>
  );
}