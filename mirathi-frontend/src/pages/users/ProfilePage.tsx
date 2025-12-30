import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { ProfileForm } from '../../features/user/components/ProfileForm';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/Alert';

/**
 * The main user profile page, dedicated to managing a user's personal and contact information.
 */
export function ProfilePage() {
  const { t } = useTranslation(['user']);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('profile_page_title', 'My Profile')}
        description={t('profile_page_description', 'View and manage your personal details.')}
      />

      <Alert>
        <Shield className="h-4 w-4" />
        <AlertTitle>{t('settings_link_title', 'Looking for account settings?')}</AlertTitle>
        <AlertDescription>
          {t('settings_link_description', 'To change your name, password, or manage marketing preferences, please visit the')}{' '}
          <Link to="/settings" className="font-semibold text-primary hover:underline">
            {t('settings_page_title', 'Account Settings')}
          </Link>.
        </AlertDescription>
      </Alert>

      <ProfileForm />
    </div>
  );
}