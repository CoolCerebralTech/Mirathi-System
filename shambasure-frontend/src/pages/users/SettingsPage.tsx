// FILE: src/pages/dashboard/SettingsPage.tsx

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'next-themes';

import { PageHeader } from '../../components/common/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Label } from '../../components/ui/Label';
import { Select } from '../../components/ui/Select';
// We'll use the ProfileForm's logic to manage these settings
import { useProfile, useUpdateProfile } from '../../features/user/user.api';
import { toast } from 'sonner';

export function SettingsPage() {
  const { t, i18n } = useTranslation(['common', 'settings']);
  const { theme, setTheme } = useTheme();
  
  // ARCHITECTURAL UPGRADE: Bind settings to the user's profile data
  const { data: profile } = useProfile();
  const updateProfileMutation = useUpdateProfile();

  // Memoize the settings to prevent re-renders, default to sensible values
  const notificationSettings = React.useMemo(() => ({
    email: profile?.profile?.notificationSettings?.email ?? true,
    sms: profile?.profile?.notificationSettings?.sms ?? false,
  }), [profile]);

  const handleNotificationChange = (key: 'email' | 'sms', value: boolean) => {
    updateProfileMutation.mutate(
      { notificationSettings: { ...notificationSettings, [key]: value } },
      {
        onSuccess: () => toast.success(t('settings:preferences_saved')),
        // onError is handled by the hook, but you could add specific toasts here too
      }
    );
  };
  
  return (
    <div className="space-y-6">
      <PageHeader
        title={t('settings:title')}
        description={t('settings:description')}
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Appearance Card */}
        <Card>
          <CardHeader>
            <CardTitle>{t('settings:appearance.title')}</CardTitle>
            <CardDescription>{t('settings:appearance.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Label htmlFor="theme">{t('settings:appearance.theme')}</Label>
            <Select value={theme} onValueChange={setTheme}>
              {/* ... SelectItems for theme ... */}
            </Select>
          </CardContent>
        </Card>

        {/* Language Card */}
        <Card>
          <CardHeader>
            <CardTitle>{t('settings:language.title')}</CardTitle>
            <CardDescription>{t('settings:language.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Label htmlFor="language">{t('settings:language.language')}</Label>
            <Select value={i18n.language} onValueChange={(value) => i18n.changeLanguage(value)}>
               {/* ... SelectItems for language ... */}
            </Select>
          </CardContent>
        </Card>
        
        {/* Notifications Card - NOW FUNCTIONAL */}
        <Card>
          <CardHeader>
            <CardTitle>{t('settings:notifications.title')}</CardTitle>
            <CardDescription>{t('settings:notifications.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             {/* ... UI for Email and SMS notifications ... */}
             {/* Example for Email */}
             <div className="flex items-center justify-between">
                <Label htmlFor="email-notifications">{t('settings:notifications.email')}</Label>
                <Switch
                  id="email-notifications"
                  checked={notificationSettings.email}
                  onCheckedChange={(checked) => handleNotificationChange('email', checked)}
                  disabled={updateProfileMutation.isPending}
                />
             </div>
          </CardContent>
        </Card>
        
        {/* Security and Danger Zone cards can remain as they are for now,
            as their functionality will depend on future backend features. */}
      </div>
    </div>
  );
}