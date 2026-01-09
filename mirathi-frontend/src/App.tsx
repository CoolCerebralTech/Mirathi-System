import { Routes, Route } from 'react-router-dom';

// Layouts
import { PublicLayout } from './components/layouts/PublicLayout';
import { AuthLayout } from './components/layouts/AuthLayout';
import { DashboardLayout } from './components/layouts/DashboardLayout';

// Route Guards
import { ProtectedRoute, GuestRoute } from './router/ProtectedRoute';

// === Pages ===
// Public
import { HomePage } from './pages/public/HomePage';
import { HowItWorksPage } from './pages/public/HowItWorksPage';
import { SolutionsPage } from './pages/public/SolutionsPage';
import { LegalPage } from './pages/public/LegalPage';

// Auth
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';

// Dashboard Core
import { DashboardHome } from './pages/DashboardHome';
import { ProfilePage } from './pages/users/ProfilePage';
import { SettingsPage } from './pages/users/SettingsPage';
import { UserDocumentsPage } from './pages/documents/UserDocumentsPage';

// Estate Service Pages
import { 
  EstateDashboardPage,
  EstateAssetsPage,
  EstateDebtsPage,
  EstateWillPage,
} from './pages/estate';

// Family Service Pages
import {
  FamilyDashboardPage,
  FamilyTreePage,
  HeirsAnalysisPage,
  GuardianshipPage,
} from './pages/family';

// Utilities
import { NotFoundPage } from './pages/NotFoundPage';

function App() {
  return (
    <Routes>
      {/* =====================================================================
          1. PUBLIC ROUTES
      ===================================================================== */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/solutions" element={<SolutionsPage />} />
        <Route path="/legal/*" element={<LegalPage />} />
        <Route path="/privacy-policy" element={<LegalPage />} />
        <Route path="/terms-of-service" element={<LegalPage />} />
      </Route>

      {/* =====================================================================
          2. GUEST ROUTES (Login/Register)
          Redirects to /dashboard if already logged in
      ===================================================================== */}
      <Route element={<GuestRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route path="reset-password" element={<ResetPasswordPage />} />
        </Route>
      </Route>

      {/* =====================================================================
          3. PROTECTED ROUTES (Dashboard)
          Requires Authentication
      ===================================================================== */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardLayout />}>
          
          {/* 
             TRAFFIC CONTROLLER:
             This page now handles "Onboarding". 
             If data is empty -> Shows "Start Here" cards.
             If data exists -> Shows High-level Analytics.
          */}
          <Route index element={<DashboardHome />} />
          
          {/* User Management */}
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="documents" element={<UserDocumentsPage />} />

          {/* Estate Domain */}
          <Route path="estate">
            <Route index element={<EstateDashboardPage />} />
            <Route path="assets" element={<EstateAssetsPage />} />
            <Route path="debts" element={<EstateDebtsPage />} />
            <Route path="will" element={<EstateWillPage />} />
            {/* Future: Multi-estate support */}
            <Route path=":estateId" element={<EstateDashboardPage />} />
          </Route>

          {/* Family Domain */}
          <Route path="family">
            <Route index element={<FamilyDashboardPage />} />
            <Route path="tree" element={<FamilyTreePage />} />
            <Route path="heirs" element={<HeirsAnalysisPage />} />
            <Route path="guardianships" element={<GuardianshipPage />} />
          </Route>

        </Route>
      </Route>

      {/* =====================================================================
          4. FALLBACK
      ===================================================================== */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;