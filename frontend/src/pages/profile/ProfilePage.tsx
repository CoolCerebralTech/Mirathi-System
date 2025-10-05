// src/pages/ProfilePage.tsx
import { useAuth } from '../hooks/useAuth';
import { UpdateProfileForm } from '../features/profile/UpdateProfileForm';
import { useAuthStore } from '../store/auth.store';
import { Link } from 'react-router-dom';
import { useAuthActions } from '../store/auth.store';

const ProfilePage = () => {
    const user = useAuthStore((state) => state.user);
    const { logout } = useAuthActions();

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">
                        Welcome, {user?.firstName}!
                    </h1>
                    <div>
                        <Link to="/dashboard" className="text-indigo-600 hover:text-indigo-800 mr-4">Dashboard</Link>
                        <button onClick={logout} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
                            Logout
                        </button>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                    <UpdateProfileForm />
                </div>

                {/* We can add the Change Password form here as another card */}
            </div>
        </div>
    );
};

export default ProfilePage;