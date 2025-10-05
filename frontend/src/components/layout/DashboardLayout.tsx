// src/components/layout/DashboardLayout.tsx

import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header'; // Import the new Header

export const DashboardLayout = () => {
  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 sm:p-8 lg:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
};