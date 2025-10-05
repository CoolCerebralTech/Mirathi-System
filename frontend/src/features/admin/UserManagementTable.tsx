// src/features/admin/UserManagementTable.tsx

import { useUsers } from '../../hooks/useUsers';
import type { UserRole } from '../../types';

export const UserManagementTable = () => {
  // The component is now incredibly clean. It just consumes the hook.
  const { users, isLoading, isError, updateRole } = useUsers();

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    if (!window.confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      return;
    }
    // Call the mutation function from our hook
    updateRole({ userId, newRole });
  };

  if (isLoading) return <div>Loading users...</div>;
  if (isError) return <div className="text-red-500">Failed to load users.</div>;

  return (
    <div className="mt-8 flow-root">
      <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
          <table className="min-w-full divide-y divide-gray-300">
            {/* ... table thead (no change) ... */}
            <tbody className="divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id}>
                  {/* ... name and email tds (no change) ... */}
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                      // Optionally disable the select while a role is being updated for this user
                      // disabled={isUpdatingRole} 
                      className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    >
                      <option value="LAND_OWNER">Land Owner</option>
                      <option value="HEIR">Heir</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};