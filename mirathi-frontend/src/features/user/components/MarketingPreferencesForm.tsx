import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Bell, Mail, MessageSquare, Megaphone, Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useCurrentUser, useUpdateSettings } from '../user.api';
import { UpdateSettingsInputSchema, type UpdateSettingsInput } from '../../../types/user.types';

import { Button } from '../../../components/ui/Button';
import { Label } from '../../../components/ui/Label';
import { Switch } from '../../../components/ui/Switch'; // Assuming you have a Switch component

export function MarketingPreferencesForm() {
  const { t } = useTranslation(['settings', 'common']);
  const { data: user } = useCurrentUser();
  const { mutate: updateSettings, isPending } = useUpdateSettings();

  const { control, handleSubmit, reset, formState: { isDirty } } = useForm<UpdateSettingsInput>({
    resolver: zodResolver(UpdateSettingsInputSchema),
  });

  useEffect(() => {
    if (user?.settings) {
      reset({
        emailNotifications: user.settings.emailNotifications,
        smsNotifications: user.settings.smsNotifications,
        marketingOptIn: user.settings.marketingOptIn,
      });
    }
  }, [user, reset]);

  const onSubmit = (data: UpdateSettingsInput) => {
    updateSettings(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      
      {/* NOTIFICATIONS */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-slate-200 flex items-center gap-2">
          <Bell className="h-5 w-5 text-amber-500" />
          {t('settings:notifications', 'System Notifications')}
        </h3>
        
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 divide-y divide-slate-800">
          
          {/* Email Switch */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                <Mail className="h-4 w-4" />
              </div>
              <div>
                <Label className="text-base font-medium">Email Notifications</Label>
                <p className="text-xs text-slate-500">Receive critical updates about your estate via email.</p>
              </div>
            </div>
            <Controller
              control={control}
              name="emailNotifications"
              render={({ field }) => (
                <Switch 
                  checked={field.value} 
                  onCheckedChange={field.onChange} 
                  disabled={isPending}
                />
              )}
            />
          </div>

          {/* SMS Switch */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                <MessageSquare className="h-4 w-4" />
              </div>
              <div>
                <Label className="text-base font-medium">SMS Notifications</Label>
                <p className="text-xs text-slate-500">Get text alerts for urgent tasks (Standard rates apply).</p>
              </div>
            </div>
            <Controller
              control={control}
              name="smsNotifications"
              render={({ field }) => (
                <Switch 
                  checked={field.value} 
                  onCheckedChange={field.onChange} 
                  disabled={isPending}
                />
              )}
            />
          </div>
        </div>
      </div>

      {/* MARKETING */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-slate-200 flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-amber-500" />
          {t('settings:marketing', 'Communications')}
        </h3>
        
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
           <div className="flex items-center justify-between">
            <div className="space-y-1">
                <Label className="text-base font-medium">Product Updates & Tips</Label>
                <p className="text-xs text-slate-500">
                  Stay updated on new features and succession law changes. No spam, ever.
                </p>
            </div>
            <Controller
              control={control}
              name="marketingOptIn"
              render={({ field }) => (
                <Switch 
                  checked={field.value} 
                  onCheckedChange={field.onChange} 
                  disabled={isPending}
                />
              )}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button 
          type="submit" 
          disabled={!isDirty || isPending}
          isLoading={isPending}
        >
          <Save className="h-4 w-4 mr-2" />
          {t('common:save_preferences', 'Save Preferences')}
        </Button>
      </div>
    </form>
  );
}