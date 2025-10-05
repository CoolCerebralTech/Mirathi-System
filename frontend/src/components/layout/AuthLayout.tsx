// src/components/layout/AuthLayout.tsx
// ============================================================================
// Layout for Authentication Pages
// ============================================================================
// - Provides a consistent container and styling for all authentication-related
//   pages (Login, Register, Forgot Password, etc.).
// - Ensures a uniform look and feel, centering the content and providing
//   a styled card for the forms.
// - Accepts a `title` prop and renders child components within the card.
// ============================================================================

// src/components/layout/AuthLayout.tsx
// ============================================================================
// Layout for Authentication Pages
// ============================================================================
// - Provides a consistent container and styling for all authentication-related
//   pages (Login, Register, Forgot Password, etc.).
// - Ensures a uniform look and feel, centering the content and providing
//   a styled card for the forms.
// - Accepts a `title` prop and renders child components within the card.
// ============================================================================
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface AuthLayoutProps {
  title: string;
  children: ReactNode;
}

export const AuthLayout = ({ title, children }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/">
          <h1 className="text-center text-4xl font-bold text-indigo-600 hover:text-indigo-700 transition-colors">
            Shamba Sure
          </h1>
        </Link>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {title}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {children}
        </div>
      </div>
    </div>
  );
};