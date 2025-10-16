// FILE: src/App.tsx
import { Routes, Route } from 'react-router-dom';

// Layouts
import { PublicLayout } from './components/layout/PublicLayout';
import { AuthLayout } from './components/layout/AuthLayout';
import { DashboardLayout } from './components/layout/DashboardLayout';

// Route Guards
import { ProtectedRoute, GuestRoute } from './router/ProtectedRoute';

// === Import Pages ===
// Public
import { HomePage } from './pages/public/HomePage';
import { AboutPage } from './pages/public/AboutPage';
import { FeaturesPage } from './pages/public/FeaturesPage';
import { ContactPage } from './pages/public/ContactPage';
// Auth
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
// Dashboard
import { DashboardHomePage } from './pages/DashboardHomePage';
import { ProfilePage } from './pages/users/ProfilePage';
import { SettingsPage } from './pages/users/SettingsPage';
import { AssetsPage } from './pages/assets/AssetsPage';
import { DocumentsPage } from './pages/documents/DocumentsPage';
import { DocumentDetailPage } from './pages/documents/DocumentDetailPage';
import { FamiliesPage } from './pages/families/FamiliesPage';
import { WillsPage } from './pages/wills/WillsPage';
import { WillDetailPage } from './pages/wills/WillDetailPage';
// Not Found
import { NotFoundPage } from './pages/NotFoundPage';

function App() {
  return (
    <Routes>
      {/* --- Public Routes --- */}
      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="features" element={<FeaturesPage />} />
        <Route path="contact" element={<ContactPage />} />
      </Route>

      {/* --- Authentication Routes (guest only) --- */}
      <Route element={<GuestRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route path="reset-password" element={<ResetPasswordPage />} />
        </Route>
      </Route>

      {/* --- Dashboard / Protected Routes --- */}
      <Route path="/dashboard" element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route index element={<DashboardHomePage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="assets" element={<AssetsPage />} />
          <Route path="documents">
            <Route index element={<DocumentsPage />} />
            <Route path=":id" element={<DocumentDetailPage />} />
          </Route>
          <Route path="families" element={<FamiliesPage />} />
          <Route path="wills">
            <Route index element={<WillsPage />} />
            <Route path=":id" element={<WillDetailPage />} />
          </Route>
        </Route>
      </Route>

      {/* --- Not Found Route (Catch-all) --- */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
