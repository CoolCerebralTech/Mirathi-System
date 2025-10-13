// FILE: src/components/layout/AuthLayout.tsx

import { Outlet, Link } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
           <Link to="/" className="text-2xl font-bold">Shamba Sure</Link>
        </div>
        <Outlet />
      </div>
    </div>
  );
}