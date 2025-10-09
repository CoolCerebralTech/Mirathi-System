// FILE: src/components/layouts/AuthLayout.tsx

import * as React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import { Landmark } from 'lucide-react';

export function AuthLayout() {
  const status = useAuthStore((state) => state.status);

  // Redirect to dashboard if already authenticated
  if (status === 'authenticated') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left Side - Form */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Landmark className="h-7 w-7" />
            </div>
            <span className="text-2xl font-bold">Shamba Sure</span>
          </div>

          {/* Form Content */}
          <Outlet />
        </div>
      </div>

      {/* Right Side - Image/Branding */}
      <div className="hidden lg:block relative bg-muted">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-background" />
        <div className="relative flex h-full flex-col items-center justify-center p-12 text-center">
          <div className="max-w-lg space-y-6">
            <h1 className="text-4xl font-bold tracking-tight">
              Secure Your Family's Legacy
            </h1>
            <p className="text-lg text-muted-foreground">
              Simplify land inheritance, protect generational wealth, and resolve
              conflicts proactively with Africa's most trusted digital estate platform.
            </p>
            <div className="grid grid-cols-3 gap-4 pt-8">
              <div className="space-y-2">
                <div className="text-3xl font-bold text-primary">10K+</div>
                <div className="text-sm text-muted-foreground">Families Protected</div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-primary">50K+</div>
                <div className="text-sm text-muted-foreground">Assets Secured</div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-primary">99%</div>
                <div className="text-sm text-muted-foreground">Dispute Prevention</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}