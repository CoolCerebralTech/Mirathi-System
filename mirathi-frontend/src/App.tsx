// FILE: src/App.tsx

import { Routes, Route } from 'react-router-dom';

// Layouts
import { PublicLayout } from './components/layout/PublicLayout';
import { AuthLayout } from './components/layout/AuthLayout';
import { DashboardLayout } from './components/layout/DashboardLayout';

// Route Guards
import { ProtectedRoute, GuestRoute } from './router/ProtectedRoute';

// === Pages ===
// Public
import { HomePage } from './pages/public/HomePage';
import { AboutPage } from './pages/public/AboutPage';
import { FeaturesPage } from './pages/public/FeaturesPage';
import { ContactPage } from './pages/public/ContactPage';
import { SecurityPage } from './pages/public/SecurityPage';

// Auth
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { VerifyEmailPage } from './pages/auth';
import { PendingVerificationPage } from './pages/auth/PendingVerificationPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';

// Onboarding (The Bridge)
import { OnboardingPage } from './pages/onboarding';

// Dashboard Core
import { DashboardHome } from './pages/DashboardHome';
import { ProfilePage } from './pages/users/ProfilePage';
import { SettingsPage } from './pages/users/SettingsPage';
import { DocumentsPage } from './pages/documents/DocumentsPage';

// Estate Service
import { 
  EstateListPage, 
  CreateEstatePage, 
  EstateDashboardPage,
  AssetDetailsPage,
  DebtManagementPage,
  TaxCompliancePage,
  DistributionPage
} from './pages/estate';

// Family Service
import {
  FamilyListPage,
  FamilyDashboardPage,
  MemberProfilePage
} from './pages/family';

// Guardianship Service
import {
  GuardianshipListPage,
  GuardianshipDetailsPage
} from './pages/guardianship';

// Not Found
import { NotFoundPage } from './pages/NotFoundPage';

function App() {
  return (
    <Routes>
      {/* 1. Public Routes */}
      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="features" element={<FeaturesPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="security" element={<SecurityPage />} />
      </Route>

      {/* 2. Guest Routes (Login/Register) */}
      <Route element={<GuestRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="verify-email" element={<VerifyEmailPage />} />
          <Route path="pending-verification" element={<PendingVerificationPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route path="reset-password" element={<ResetPasswordPage />} />
        </Route>
      </Route>

      {/* 3. Protected Routes Wrapper */}
      <Route element={<ProtectedRoute />}>
        
        {/* A. Onboarding (Standalone - No Dashboard Layout) */}
        <Route path="/onboarding" element={<OnboardingPage />} />

        {/* B. Dashboard Area (Uses Dashboard Layout) */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          
          {/* Index: The Traffic Controller */}
          <Route index element={<DashboardHome />} />
          
          {/* User Management */}
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="documents" element={<DocumentsPage />} />

          {/* --- ESTATE SERVICE --- */}
          <Route path="estates">
            <Route index element={<EstateListPage />} />
            <Route path="new" element={<CreateEstatePage />} />
            <Route path=":estateId" element={<EstateDashboardPage />} />
            <Route path=":estateId/assets" element={<EstateDashboardPage />} />
            <Route path=":etateId/assets/:assetId" element={<AssetDetailsPage />} />
            <Route path=":estateId/debts" element={<DebtManagementPage />} />
            <Route path="/estates/:estateId/tax" element={<TaxCompliancePage />} />
            <Route path="/estates/:estateId/distribution" element={<DistributionPage />} />
          </Route>

          {/* --- FAMILY SERVICE --- */}
          <Route path="families">
            <Route index element={<FamilyListPage />} />
            <Route path=":id" element={<FamilyDashboardPage />} />
            <Route path=":familyId/member/:memberId" element={<MemberProfilePage />} />
          </Route>

          {/* --- GUARDIANSHIP SERVICE --- */}
          <Route path="guardianship">
            <Route index element={<GuardianshipListPage />} />
            <Route path=":id" element={<GuardianshipDetailsPage />} />
          </Route>

        </Route>
      </Route>

      {/* 4. Catch-all */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;