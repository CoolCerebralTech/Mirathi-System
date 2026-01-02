import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Mail, MessageSquare, Bell } from 'lucide-react';

import { UpdateMarketingPreferencesRequestSchema, type UpdateMarketingPreferencesInput } from '../../../types';
import { useUpdateMarketingPreferences, useCurrentProfile } from '../../user/user.api'; // Adjust path

import { Button } from '../../../components/ui/Button';
import { Checkbox } from '../../../components/ui/Checkbox';
import { Label } from '../../../components/ui/Label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../../../components/ui/Card';
import { Switch } from '../../../components/ui/Switch';

/**
 * A form for managing user marketing preferences.
 */
export function MarketingPreferencesForm() {
  const { t } = useTranslation(['user', 'common']);
  const { data: currentProfile } = useCurrentProfile();
  const { mutate: updatePreferences, isPending } = useUpdateMarketingPreferences();

  const {
    handleSubmit,
    register,
    watch,
    setValue,
    formState: { isDirty, isValid },
  } = useForm<UpdateMarketingPreferencesInput>({
    resolver: zodResolver(UpdateMarketingPreferencesRequestSchema),
    mode: 'onTouched',
    values: {
      marketingOptIn: currentProfile?.marketingOptIn ?? false,
      marketingCategories: (currentProfile?.marketingCategories as UpdateMarketingPreferencesInput['marketingCategories']) ?? [],
      communicationChannels: (currentProfile?.communicationChannels as UpdateMarketingPreferencesInput['communicationChannels']) ?? [],
    },
  });

  const marketingOptIn = watch('marketingOptIn');

  const onSubmit = (formData: UpdateMarketingPreferencesInput) => {
    updatePreferences(formData);
  };

  const marketingCategories = [
    { id: 'newsletter', label: t('user:category_newsletter', 'Newsletter') },
    { id: 'promotions', label: t('user:category_promotions', 'Promotions & Offers') },
    { id: 'product_updates', label: t('user:category_updates', 'Product Updates') },
    { id: 'events', label: t('user:category_events', 'Events & Webinars') },
  ];

  const communicationChannels = [
    { id: 'email', label: t('user:channel_email', 'Email'), icon: Mail },
    { id: 'sms', label: t('user:channel_sms', 'SMS'), icon: MessageSquare },
    { id: 'push', label: t('user:channel_push', 'Push Notifications'), icon: Bell },
  ];

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>{t('user:marketing_title', 'Marketing Preferences')}</CardTitle>
        <CardDescription>{t('user:marketing_description', 'Choose how you want to hear from us.')}</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="marketingOptIn" className="text-base font-semibold">
                {t('user:receive_communications', 'Receive Marketing Communications')}
              </Label>
              <p className="text-sm text-text-muted">
                {t('user:opt_in_description', 'Stay up-to-date with new features and offers.')}
              </p>
            </div>
            <Switch
              id="marketingOptIn"
              checked={marketingOptIn}
              onCheckedChange={(checked) => setValue('marketingOptIn', checked, { shouldDirty: true })}
              disabled={isPending}
            />
          </div>

          {marketingOptIn && (
            <div className="space-y-6 rounded-lg border p-4 animate-in fade-in">
              {/* Marketing Categories */}
              <div className="space-y-3">
                <Label className="font-semibold">{t('user:topics_interest', 'Topics of Interest')}</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {marketingCategories.map((category) => (
                    <div key={category.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`category-${category.id}`}
                        value={category.id}
                        {...register('marketingCategories')}
                        disabled={isPending}
                      />
                      <Label htmlFor={`category-${category.id}`} className="font-normal">{category.label}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Communication Channels */}
              <div className="space-y-3">
                <Label className="font-semibold">{t('user:preferred_channels', 'Preferred Channels')}</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {communicationChannels.map((channel) => (
                    <div key={channel.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`channel-${channel.id}`}
                        value={channel.id}
                        {...register('communicationChannels')}
                        disabled={isPending}
                      />
                      <Label htmlFor={`channel-${channel.id}`} className="font-normal flex items-center gap-2">
                        <channel.icon className="h-4 w-4 text-text-muted" />
                        {channel.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end bg-neutral-50 p-4">
          <Button type="submit" isLoading={isPending} disabled={!isDirty || !isValid || isPending}>
            {t('common:save_preferences', 'Save Preferences')}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}