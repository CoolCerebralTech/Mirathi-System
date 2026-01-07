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

// Estate Service Pages
import { 
  EstateDashboardPage,
  EstateAssetsPage,
  EstateDebtsPage,
  EstateWillPage,
} from './pages/estate';

// Family Service - Complete Suite
import {
  FamilyDashboardPage,
  FamilyTreePage,
  HeirsAnalysisPage,
  GuardianshipListPage,
} from './pages/family';

// Not Found
import { NotFoundPage } from './pages/NotFoundPage';

function App() {
  return (
    <Routes>
      {/* =====================================================================
          1. PUBLIC ROUTES
          Accessible to everyone (logged in or not)
      ===================================================================== */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/solutions" element={<SolutionsPage />} />
        <Route path="/features" element={<SolutionsPage />} />
        <Route path="/legal/*" element={<LegalPage />} />
        <Route path="/privacy-policy" element={<LegalPage />} />
        <Route path="/terms-of-service" element={<LegalPage />} />
      </Route>

      {/* =====================================================================
          2. GUEST ROUTES
          Only accessible when NOT logged in (Login/Register)
      ===================================================================== */}
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

      {/* =====================================================================
          3. PROTECTED ROUTES
          Only accessible when logged in and verified
      ===================================================================== */}
      <Route element={<ProtectedRoute />}>
        
        {/* -------------------------------------------------------------------
            A. ONBOARDING (Standalone - No Dashboard Layout)
            First-time user setup flow
        ------------------------------------------------------------------- */}
        <Route path="/onboarding" element={<OnboardingPage />} />

        {/* -------------------------------------------------------------------
            B. DASHBOARD AREA (Uses Dashboard Layout)
            Main application area with sidebar navigation
        ------------------------------------------------------------------- */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          
          {/* Dashboard Index - Traffic Controller */}
          <Route index element={<DashboardHome />} />
          
          {/* User Management */}
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="documents" element={<UserDocumentsPage />} />

          {/* ===============================================================
              ESTATE SERVICE - Complete Suite
              Manages assets, debts, net worth, and will creation
              
              Routes:
              /dashboard/estate                → Main dashboard (overview)
              /dashboard/estate/assets         → Asset management
              /dashboard/estate/debts          → Debt management
              /dashboard/estate/will           → Will creation & management
              /dashboard/estate/:estateId/*    → Specific estate (future)
          =============================================================== */}
          <Route path="estate">
            {/* 
              Main Estate Dashboard
              Shows overview, net worth, legal insights, and quick actions
              Uses useEstateSummary() to fetch estate data
              If no estate exists, shows CreateEstateDialog
            */}
            <Route index element={<EstateDashboardPage />} />
            
            {/* 
              Assets Management Page
              Full-page asset inventory with add/edit/verify functionality
              Displays all assets with polymorphic details (Land/Vehicle/Generic)
            */}
            <Route path="assets" element={<EstateAssetsPage />} />
            
            {/* 
              Debts Management Page
              Liability tracking with Section 45 priority ordering
              Payment recording and debt status management
            */}
            <Route path="debts" element={<EstateDebtsPage />} />
            
            {/* 
              Will Creation & Management Page
              Complete will builder with beneficiaries and witnesses
              Document preview, print, and signing instructions
            */}
            <Route path="will" element={<EstateWillPage />} />
            
            {/* 
              Specific Estate Routes (Future: Multi-estate support)
              Currently estateId routes back to same components
              Useful for family members managing multiple estates
            */}
            <Route path=":estateId">
              <Route index element={<EstateDashboardPage />} />
              <Route path="assets" element={<EstateAssetsPage />} />
              <Route path="debts" element={<EstateDebtsPage />} />
              <Route path="will" element={<EstateWillPage />} />
            </Route>
          </Route>

          {/* ===============================================================
              FAMILY SERVICE - COMPLETE SUITE
              Manages family tree, heirs, and guardianship
              
              Routes:
              /dashboard/family                    → Main dashboard
              /dashboard/family/tree              → Full-screen tree view
              /dashboard/family/heirs             → Heir analysis
              /dashboard/family/guardianships     → Guardian management
              /dashboard/family/:familyId/*       → Specific family routes
          =============================================================== */}
          <Route path="family">
            {/* 
              Main Family Dashboard
              Primary entry point - shows overview, tree, heirs, and stats
              Uses useMyFamily() hook to get user's family
            */}
            <Route index element={<FamilyDashboardPage />} />
            
            {/* 
              Family Tree Page
              Full-screen interactive family tree visualization
              Features: export, share, fullscreen mode
            */}
            <Route path="tree" element={<FamilyTreePage />} />
            
            {/* 
              Heirs Analysis Page
              Detailed succession analysis based on Kenyan Law
              Shows potential heirs, legal framework, and scenarios
            */}
            <Route path="heirs" element={<HeirsAnalysisPage />} />
            
            {/* 
              Guardianship List Page
              Manage all minors and their guardianship assignments
              Compliance tracking with Children Act (Cap 141)
            */}
            <Route path="guardianships" element={<GuardianshipListPage />} />
            
            {/* 
              Specific Family Routes (Future: Multi-family support)
              Currently passes familyId to same components
            */}
            <Route path=":familyId">
              <Route index element={<FamilyDashboardPage />} />
              <Route path="tree" element={<FamilyTreePage />} />
              <Route path="heirs" element={<HeirsAnalysisPage />} />
              <Route path="guardianships" element={<GuardianshipListPage />} />
            </Route>
          </Route>

        </Route>
      </Route>

      {/* =====================================================================
          4. CATCH-ALL ROUTE
          404 Not Found page
      ===================================================================== */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;