import { MarketingPreferencesForm } from '@/features/user/components/MarketingPreferencesForm';
import { DeactivateAccountForm } from '@/features/user/components/DeactivateAccountForm';

export function SettingsPage() {
  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-8">
      
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-serif font-bold text-white">Account Settings</h1>
        <p className="text-slate-400">Manage notifications, preferences, and account security.</p>
      </div>

      {/* PREFERENCES CARD */}
      <div className="bg-slate-950 rounded-xl border border-slate-800 p-6 shadow-sm">
        <MarketingPreferencesForm />
      </div>

      {/* DANGER ZONE */}
      <div className="pt-8">
        <h2 className="text-xl font-bold text-white mb-4">Account Actions</h2>
        <DeactivateAccountForm />
      </div>
    </div>
  );
}