// src/pages/DashboardPage.tsx

import { useAuthStore } from '../store/auth.store';

const StatCard = ({ title, value }: { title: string, value: string }) => (
  <div className="bg-white p-6 rounded-lg shadow">
    <h3 className="text-sm font-medium text-gray-500 truncate">{title}</h3>
    <p className="mt-1 text-3xl font-semibold text-gray-900">{value}</p>
  </div>
);

const DashboardPage = () => {
  const user = useAuthStore((state) => state.user);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900">
        Welcome back, {user?.firstName}!
      </h1>
      <p className="mt-2 text-lg text-gray-600">
        Here's a summary of your estate.
      </p>

      {/* Stats Section */}
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Total Land Parcels" value="0" />
        <StatCard title="Documents Secured" value="0" />
        <StatCard title="Active Wills" value="0" />
      </div>

      {/* Quick Actions Section */}
      <div className="mt-10">
        <h2 className="text-xl font-semibold text-gray-800">Quick Actions</h2>
        <div className="mt-4 flex space-x-4">
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                Register a New Will
            </button>
            <button className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50">
                Upload a Document
            </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;