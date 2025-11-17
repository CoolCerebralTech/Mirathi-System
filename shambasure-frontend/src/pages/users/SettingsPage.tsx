import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../components/common/PageHeader';
import { UpdateNameForm } from '../../features/user/components/UpdateNameForm';
import { ChangePasswordForm } from '../../features/user/components/ChangePasswordForm';
import { MarketingPreferencesForm } from '../../features/user/components/MarketingPreferencesForm';
import { DeactivateAccountForm } from '../../features/user/components/DeactivateAccountForm';
import { Separator } from '../../components/ui/Separator';

/**
 * A central page for users to manage all account-level settings, including
 * personal info, security, marketing, and account status.
 */
export function SettingsPage() {
  const { t } = useTranslation(['settings', 'user', 'common']);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('settings:title', 'Account Settings')}
        description={t('settings:description', 'Manage your account details, security, and preferences.')}
      />

      <div className="space-y-10">
        {/* === SECTION: ACCOUNT DETAILS === */}
        <section aria-labelledby="account-details-heading">
          <h2 id="account-details-heading" className="text-xl font-semibold tracking-tight text-text">
            {t('user:personal_details_title', 'Personal Details')}
          </h2>
          <p className="mt-1 text-sm text-text-muted">
            {t('user:update_name_description', 'Update your first and last name.')}
          </p>
          <div className="mt-4 max-w-3xl">
            <UpdateNameForm />
          </div>
        </section>

        <Separator />

        {/* === SECTION: SECURITY === */}
        <section aria-labelledby="security-heading">
          <h2 id="security-heading" className="text-xl font-semibold tracking-tight text-text">
            {t('user:security_title', 'Security')}
          </h2>
          <p className="mt-1 text-sm text-text-muted">
            {t('auth:change_password_prompt', 'Update your password for enhanced security.')}
          </p>
          <div className="mt-4 max-w-3xl">
            <ChangePasswordForm />
          </div>
        </section>

        <Separator />

        {/* === SECTION: PREFERENCES === */}
        <section aria-labelledby="preferences-heading">
          <h2 id="preferences-heading" className="text-xl font-semibold tracking-tight text-text">
            {t('user:preferences_title', 'Preferences')}
          </h2>
          <p className="mt-1 text-sm text-text-muted">
            {t('user:marketing_description', 'Choose how you want to hear from us.')}
          </p>
          <div className="mt-4 max-w-3xl">
            <MarketingPreferencesForm />
          </div>
        </section>
        
        <Separator />

        {/* === SECTION: DANGER ZONE === */}
        <section aria-labelledby="danger-zone-heading">
          <h2 id="danger-zone-heading" className="text-xl font-semibold tracking-tight text-danger">
            {t('settings:danger_zone.title', 'Danger Zone')}
          </h2>
          <p className="mt-1 text-sm text-text-muted">
            {t('user:deactivate_description', 'Permanently deactivate your account.')}
          </p>
          <div className="mt-4 max-w-3xl">
            <DeactivateAccountForm />
          </div>
        </section>
      </div>
    </div>
  );
}