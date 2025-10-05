// src/components/layout/Sidebar.tsx

// ... imports
import { useAuth } from '../../hooks/useAuth';
import { ArrowLeftOnRectangleIcon } from '@heroicons/react/24/outline';


const baseNavigation = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'My Wills', href: '/wills' },
  { name: 'My Documents', href: '/documents' },
  { name: 'My Assets', href: '/assets' },
  { name: 'My Families', href: '/families' },
  { name: 'Profile', href: '/profile' },
];

const adminNavigation = [
    { name: 'User Management', href: '/admin/users' },
]
// ... navigation arrays and CSS classes (no change)

export const Sidebar = () => {
  const { user, actions } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const navigation = isAdmin ? [...baseNavigation, ...adminNavigation] : baseNavigation;

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
      {/* ... Header (no change) ... */}
      <div className="flex-1 flex flex-col overflow-y-auto p-4">
        <nav className="space-y-1">
          {/* ... nav mapping (no change) ... */}
        </nav>
        {/* User profile section at the bottom */}
        <div className="mt-auto border-t border-gray-200 pt-4">
            <div className="flex items-center gap-x-3 px-2">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-200 text-indigo-700 flex items-center justify-center">
                    <span className="font-bold text-lg">{user?.firstName.charAt(0)}{user?.lastName.charAt(0)}</span>
                </div>
                <div>
                    <p className="text-sm font-semibold text-gray-900">{user?.firstName} {user?.lastName}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
            </div>
            <button 
                onClick={actions.logout}
                className="w-full mt-4 group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-200 hover:text-gray-900"
            >
                <ArrowLeftOnRectangleIcon className="mr-3 h-6 w-6 text-gray-400 group-hover:text-gray-500"/>
                Sign out
            </button>
        </div>
      </div>
    </div>
  );
};