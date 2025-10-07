// FILE: src/pages/auth/ProfilePage.tsx

import { ProfileForm } from '../../features/auth/components/ProfileForm';
import { PageHeader } from '../../components/common/PageHeader';
import { ChangePasswordForm } from '../../features/auth/components/ChangePasswordForm'; // We'll create this next

export function ProfilePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Your Profile"
        description="Manage your personal details and account settings."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* The main profile update form */}
        <ProfileForm />

        {/* Password change form, placed side-by-side or below */}
        <ChangePasswordForm />
      </div>
    </div>
  );
}