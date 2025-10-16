// FILE: src/components/layout/AuthLayout.tsx

import { Outlet, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Leaf } from 'lucide-react';

/**
 * A specialized layout for authentication pages (Login, Register, etc.).
 * It provides a focused, branded, and visually appealing environment,
 * separating the auth forms from the main application navigation.
 */
export function AuthLayout() {
  const { t } = useTranslation(['auth', 'common']);

  return (
    <div className="grid min-h-screen w-full grid-cols-1 lg:grid-cols-2">
      {/* --- Form Panel --- */}
      <div className="flex items-center justify-center p-6 lg:p-8">
        <div className="mx-auto w-full max-w-md">
          <Outlet />
        </div>
      </div>

      {/* --- Visual / Branding Panel --- */}
      <div className="hidden bg-muted lg:flex lg:flex-col">
        <div className="flex h-16 items-center px-8">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <Leaf className="h-6 w-6 text-primary" />
            <span>{t('common:app_name')}</span>
          </Link>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center p-12 text-center">
          {/* This could be an image or illustration */}
          <div className="mb-8 flex h-64 w-64 items-center justify-center rounded-full bg-background">
            <span className="text-8xl">🏞️</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t('auth:layout_title')}
          </h1>
          <p className="mt-4 max-w-sm text-muted-foreground">
            {t('auth:layout_subtitle')}
          </p>
        </div>
      </div>
    </div>
  );
}
