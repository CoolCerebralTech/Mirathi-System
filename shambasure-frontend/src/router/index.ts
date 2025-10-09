// FILE: src/router/index.tsx (Final Version)

import { Routes, Route, Navigate } from 'react-router-dom';

// Import Layouts & Guards
import { PublicLayout } from '../components/layouts/PublicLayout';
import { AuthLayout } from '../components/layouts/AuthLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { AdminRoute } from './AdminRoute'; // Our new admin guard

// --- Import ALL Pages ---
// Public Pages
import { HomePage } from '../pages/public/HomePage';
import { AboutPage } from '../pages/public/AboutPage';
import { ContactPage } from '../pages/public/ContactPage';

// Auth Pages
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '../pages/auth/ResetPasswordPage';

// Authenticated User Pages
import { DashboardHomePage } from '../pages/DashboardHomePage';
import { AssetsPage } from '../pages/AssetsPage';
import { WillsPage } from '../pages/WillsPage';
import { WillDetailPage } from '../pages/WillDetailPage';
import { DocumentsPage } from '../pages/DocumentsPage';
import { FamilyPage } from '../pages/FamilyPage';
import { ProfilePage } from '../pages/auth/ProfilePage';

// Admin Pages
import { AdminUsersPage } from '../pages/admin/AdminUsersPage';
import { AdminAuditLogsPage } from '../pages/admin/AdminAuditLogsPage';
import { AdminTemplatesPage } from '../pages/admin/AdminTemplatesPage';


export function AppRouter() {
  return (
    <Routes>
      {/* =================================================================== */}
      {/* 1. PUBLIC-FACING ROUTES (Home, About, Contact)                    */}
      {/* =================================================================== */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        {/* Add Privacy Policy, Terms, etc. here later */}
      </Route>

      {/* =================================================================== */}
      {/* 2. AUTHENTICATION ROUTES (Login, Register)                        */}
      {/* =================================================================== */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Route>

      {/* =================================================================== */}
      {/* 3. PROTECTED USER ROUTES (Dashboard, Assets, etc.)                */}
      {/* =================================================================== */}
      <Route element={<ProtectedRoute />}>
        {/* The DashboardLayout is rendered by ProtectedRoute */}
        <Route path="/dashboard" element={<DashboardHomePage />} />
        <Route path="/assets" element={<AssetsPage />} />
        <Route path="/wills" element={<WillsPage />} />
        <Route path="/wills/:id" element={<WillDetailPage />} />
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/family" element={<FamilyPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        {/* Add Settings, Support pages here later */}

        {/* --- Nested Admin Routes --- */}
        {/* These are also inside ProtectedRoute, so the user must be logged in. */}
        {/* The AdminRoute then adds the second layer of role-based protection. */}
        <Route path="/admin" element={<AdminRoute />}>
            <Route index element={<Navigate to="/admin/users" replace />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="auditing" element={<AdminAuditLogsPage />} />
            <Route path="templates" element={<AdminTemplatesPage />} />
        </Route>
      </Route>

      {/* =================================================================== */}
      {/* 4. CATCH-ALL / NOT FOUND ROUTE                                      */}
      {/* =================================================================== */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}