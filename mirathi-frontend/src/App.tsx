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
import { HowItWorksPage } from './pages/public/HowItWorksPage';
import { SolutionsPage } from './pages/public/SolutionsPage';
import { LegalPage } from './pages/public/LegalPage';


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
import { UserDocumentsPage } from './pages/documents/UserDocumentsPage';

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
  FamilyDashboardPage,
} from './pages/family';

// Not Found
import { NotFoundPage } from './pages/NotFoundPage';
import { ComplianceReportPage, ExecuteWillPage, ExecutorDashboardPage, WillDashboardPage, WillEditorPage } from './pages/will';

function App() {
  return (
    <Routes>
      {/* 1. Public Routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/solutions" element={<SolutionsPage />} />
        <Route path="/features" element={<SolutionsPage />} /> {/* Reuse for now */}
        <Route path="/legal/*" element={<LegalPage />} />
        <Route path="/privacy-policy" element={<LegalPage />} />
        <Route path="/terms-of-service" element={<LegalPage />} />
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
          <Route path="documents" element={<UserDocumentsPage />} />

          {/* 4.2. Will Module (Estate Planning) */}
          <Route path="wills" element={<WillDashboardPage />} />
          <Route path="will/:id/edit" element={<WillEditorPage />} />
          <Route path="will/:id/compliance" element={<ComplianceReportPage />} />
          <Route path="will/:id/execute" element={<ExecuteWillPage />} />
          <Route path="will/:id/executor" element={<ExecutorDashboardPage />} />
          
          {/* --- ESTATE SERVICE --- */}
          <Route path="estates">
            <Route index element={<EstateListPage />} />
            <Route path="new" element={<CreateEstatePage />} />
            <Route path=":estateId" element={<EstateDashboardPage />} />
            <Route path=":estateId/assets" element={<EstateDashboardPage />} />
            <Route path=":etateId/assets/:assetId" element={<AssetDetailsPage />} />
            <Route path=":estateId/debts" element={<DebtManagementPage />} />
            <Route path=":estateId/tax" element={<TaxCompliancePage />} />
            <Route path=":estateId/distribution" element={<DistributionPage />} />
          </Route>

          {/* --- FAMILY SERVICE --- */}
          <Route path="families">
            <Route path=":id" element={<FamilyDashboardPage />} />
          </Route>

        </Route>
      </Route>

      {/* 4. Catch-all */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;