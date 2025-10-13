import { Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './protectedRoute';
import { AdminDashboardPage } from '../features/admin/pages/AdminDashboardPage';
import { AdminUsersPage } from '../features/admin/pages/AdminUsersPage';
import { AdminDocumentsPage } from '../features/admin/pages/AdminDocumentsPage';
import { AdminTemplatesPage } from '../features/admin/pages/AdminTemplatesPage';
import { AdminLogsPage } from '../features/admin/pages/AdminLogsPage';

export function AdminRoutes() {
  return (
    <Routes>
      {/* All admin routes are implicitly protected by the parent, but we can add role checks here */}
      <Route element={<ProtectedRoute allowedRoles={['ADMIN']} children={undefined} />}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="documents" element={<AdminDocumentsPage />} />
        <Route path="templates" element={<AdminTemplatesPage />} />
        <Route path="logs" element={<AdminLogsPage />} />
      </Route>
    </Routes>
  );
}