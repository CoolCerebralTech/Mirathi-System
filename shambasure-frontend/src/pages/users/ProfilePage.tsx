// FILE: src/pages/users/ProfilePage.tsx

import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../components/common/PageHeader';
import { ProfileForm } from '../../features/user/components/ProfileForm';
import { ChangePasswordForm } from '../../features/user/components/ChangePasswordForm';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../components/ui/Tabs';

/**
 * The main user profile page, acting as a container for various user management components.
 * It utilizes a tabbed layout to separate profile information from security settings.
 */
export function ProfilePage() {
  const { t } = useTranslation(['user', 'common']);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('profile_page_title')}
        description={t('profile_page_description')}
      />

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:max-w-md">
          <TabsTrigger value="profile">{t('profile_tab')}</TabsTrigger>
          <TabsTrigger value="security">{t('security_tab')}</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <ProfileForm />
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          {/* Constrain the width for a better form layout on larger screens */}
          <div className="max-w-2xl">
            <ChangePasswordForm />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}