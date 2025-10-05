import { UserManagementTable } from '../features/admin/UserManagementTable';

const AdminUsersPage = () => {
    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="mt-2 text-lg text-gray-600">
                View and manage all users in the system.
            </p>
            <UserManagementTable />
        </div>
    );
};

export default AdminUsersPage;