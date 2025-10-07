// FILE: src/components/layouts/AuthLayout.tsx

import { Outlet } from 'react-router-dom';

// A simple SVG for a logo placeholder.
// In a real application, you would replace this with an <img /> tag or a more complex SVG logo.
const LogoPlaceholder = () => (
    <svg 
        className="h-8 w-auto text-primary" 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        xmlns="http://www.w3.org/2000/svg"
    >
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5-10-5-10 5z" />
    </svg>
);


export function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-center">
            <LogoPlaceholder />
        </div>
        
        {/* The <Outlet> is the placeholder provided by React Router. */}
        {/* It will render the specific page component that matches the current URL. */}
        {/* For example, if the user is on '/login', the LoginPage component will be rendered here. */}
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}