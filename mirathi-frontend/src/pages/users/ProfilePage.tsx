import { ProfileForm } from '@/features/user/components/ProfileForm';

export function ProfilePage() {
  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-serif font-bold text-white">My Profile</h1>
        <p className="text-slate-400">Manage your personal information and contact details.</p>
      </div>

      <div className="bg-slate-950 rounded-xl border border-slate-800 p-6 shadow-sm">
        <ProfileForm />
      </div>
    </div>
  );
}