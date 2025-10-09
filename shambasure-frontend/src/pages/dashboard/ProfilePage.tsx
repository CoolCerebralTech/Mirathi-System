// FILE: src/pages/dashboard/ProfilePage.tsx

import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../components/common/PageHeader';
import { ProfileForm } from '../../features/user/components/ProfileForm';
import { ChangePasswordForm } from '../../features/auth/components/ChangePasswordForm';

export function ProfilePage() {
  const { t } = useTranslation(['common']);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile"
        description="Manage your account information and preferences"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <ProfileForm />
        </div>
        
        <div className="lg:col-span-2">
          <ChangePasswordForm />
        </div>
      </div>
    </div>
  );
}