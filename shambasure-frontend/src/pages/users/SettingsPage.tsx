// FILE: src/pages/users/SettingsPage.tsx

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { KeyRound, ShieldAlert } from 'lucide-react';

import { useProfile, useUpdateProfile } from '../../features/user/user.api';

import { PageHeader } from '../../components/common/PageHeader';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '../../components/ui/Card';
import { Label } from '../../components/ui/Label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/Select';
import { Switch } from '../../components/ui/Switch';
import { Button } from '../../components/ui/Button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../../components/ui/AlertDialog';

/**
 * A page for users to manage their application preferences, including
 * appearance, language, notifications, and account security.
 */
export function SettingsPage() {
  const { t, i18n } = useTranslation(['settings', 'common']);
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const { data: user } = useProfile();
  const { mutate: updateProfile, isPending } = useUpdateProfile();

  const notificationSettings = React.useMemo(
    () => ({
      email: user?.profile?.notificationSettings?.email ?? true,
      sms: user?.profile?.notificationSettings?.sms ?? false,
    }),
    [user],
  );

  const handleNotificationChange = (
    key: keyof typeof notificationSettings,
    value: boolean,
  ) => {
    updateProfile(
      { notificationSettings: { ...notificationSettings, [key]: value } },
      {
        onSuccess: () => toast.success(t('preferences_saved_toast')),
        // onError is handled by the hook's default options
      },
    );
  };

  // TODO: Implement this mutation when the API is ready
  const handleDeleteAccount = () => {
    toast.error('This feature is not yet implemented.');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('description')}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* --- Preferences Column --- */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('appearance.title')}</CardTitle>
              <CardDescription>{t('appearance.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Label htmlFor="theme">{t('appearance.theme')}</Label>
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger id="theme">
                  <SelectValue placeholder={t('appearance.theme_placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">{t('appearance.light')}</SelectItem>
                  <SelectItem value="dark">{t('appearance.dark')}</SelectItem>
                  <SelectItem value="system">{t('appearance.system')}</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('language.title')}</CardTitle>
              <CardDescription>{t('language.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Label htmlFor="language">{t('language.language')}</Label>
              <Select
                value={i18n.resolvedLanguage}
                onValueChange={(lang) => i18n.changeLanguage(lang)}
              >
                <SelectTrigger id="language">
                  <SelectValue placeholder={t('language.language_placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="sw">Kiswahili</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('notifications.title')}</CardTitle>
              <CardDescription>{t('notifications.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <Label htmlFor="email-notifications">{t('notifications.email')}</Label>
                <Switch
                  id="email-notifications"
                  checked={notificationSettings.email}
                  onCheckedChange={(checked: boolean) => handleNotificationChange('email', checked)}
                  disabled={isPending}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <Label htmlFor="sms-notifications">{t('notifications.sms')}</Label>
                <Switch
                  id="sms-notifications"
                  checked={notificationSettings.sms}
                  onCheckedChange={(checked: boolean) => handleNotificationChange('sms', checked)}
                  disabled={isPending}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* --- Security Column --- */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('security.title')}</CardTitle>
              <CardDescription>{t('security.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/profile/change-password')}>
                <KeyRound className="mr-2 h-4 w-4" />
                {t('security.change_password_button')}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">{t('danger_zone.title')}</CardTitle>
              <CardDescription>{t('danger_zone.description')}</CardDescription>
            </CardHeader>
            <CardFooter>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <ShieldAlert className="mr-2 h-4 w-4" />
                    {t('danger_zone.delete_account_button')}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('danger_zone.confirm_title')}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('danger_zone.confirm_description')}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('common:cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteAccount}>
                      {t('danger_zone.confirm_action')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}