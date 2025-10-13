// FILE: src/pages/dashboard/ProfilePage.tsx 

import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../components/common/PageHeader';
import { ProfileForm } from '../../features/user/components/ProfileForm';
// BUG FIX: Corrected the component name casing to match the file name.
import { ChangePasswordForm } from '../../features/user/components/ChangePasswordForm'; 
// Assuming a simple Tabs component exists in your UI library
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/Tabs';

export function ProfilePage() {
  const { t } = useTranslation(['user', 'common']);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('user:profile_and_settings')}
        description={t('user:profile_and_settings_prompt')}
      />

      {/* ARCHITECTURAL UPGRADE: Use a tabbed interface for better organization and scalability. */}
      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">{t('user:profile')}</TabsTrigger>
          <TabsTrigger value="security">{t('user:security')}</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          {/* The ProfileForm is the primary content for this tab. */}
          <ProfileForm />
        </TabsContent>

        <TabsContent value="security">
          {/* The ChangePasswordForm logically belongs under a "Security" tab. */}
          <div className="max-w-2xl">
            <ChangePasswordForm />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}