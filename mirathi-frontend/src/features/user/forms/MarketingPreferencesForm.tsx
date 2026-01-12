import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Mail, MessageSquare, Bell, Megaphone } from 'lucide-react';

import { UpdateMarketingPreferencesRequestSchema, type UpdateMarketingPreferencesInput } from '@/types/profile.types';
import { useUpdateMarketingPreferences, useCurrentProfile } from '../../../api/user/user.api';

import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Label } from '@/components/ui/Label';
import { Switch } from '@/components/ui/Switch';

export function MarketingPreferencesForm() {
  useTranslation(['user', 'common']);
  const { data: currentProfile } = useCurrentProfile();
  const { mutate: updatePreferences, isPending } = useUpdateMarketingPreferences();

  const {
    handleSubmit,
    watch,
    setValue,
    formState: { isDirty, isValid },
  } = useForm<UpdateMarketingPreferencesInput>({
    resolver: zodResolver(UpdateMarketingPreferencesRequestSchema),
    mode: 'onTouched',
    values: {
      marketingOptIn: currentProfile?.marketingOptIn ?? false,
    },
  });

  const marketingOptIn = watch('marketingOptIn');

  const onSubmit = (formData: UpdateMarketingPreferencesInput) => {
    updatePreferences(formData);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-start gap-4">
        <div className="p-2 bg-emerald-100/50 rounded-lg text-[#0F3D3E]">
          <Megaphone className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900">Communication Preferences</h3>
          <p className="text-sm text-slate-500">Control how and when we contact you.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-6 space-y-6">
        
        {/* Master Switch */}
        <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4 bg-slate-50/50">
          <div className="space-y-0.5">
            <Label htmlFor="marketingOptIn" className="text-sm font-bold text-slate-900">
              Receive Product Updates & Offers
            </Label>
            <p className="text-xs text-slate-500">
              Stay informed about new legal tools and platform features.
            </p>
          </div>
          <Switch
            id="marketingOptIn"
            checked={marketingOptIn}
            onCheckedChange={(checked) => setValue('marketingOptIn', checked, { shouldDirty: true })}
            disabled={isPending}
            className="data-[state=checked]:bg-[#0F3D3E]"
          />
        </div>

        {/* Detailed Options (Conditional) */}
        {marketingOptIn && (
          <div className="space-y-6 rounded-lg border border-slate-100 p-5 bg-white animate-in fade-in slide-in-from-top-2">
            
            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Preferred Channels</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'email', label: 'Email', icon: Mail },
                  { id: 'sms', label: 'SMS', icon: MessageSquare },
                  { id: 'push', label: 'Push', icon: Bell },
                ].map((channel) => (
                  <div key={channel.id} className="flex items-center space-x-2 border border-slate-100 p-3 rounded-md hover:bg-slate-50 transition-colors">
                    <Checkbox
                      id={`channel-${channel.id}`}
                      value={channel.id}
                      disabled={isPending}
                      className="border-slate-300 data-[state=checked]:bg-[#0F3D3E]"
                    />
                    <Label htmlFor={`channel-${channel.id}`} className="font-medium text-sm text-slate-700 flex items-center gap-2 cursor-pointer">
                      <channel.icon className="h-4 w-4 text-slate-400" />
                      {channel.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t border-slate-100">
          <Button 
            type="submit" 
            isLoading={isPending} 
            disabled={!isDirty || !isValid || isPending}
            className="bg-[#0F3D3E] hover:bg-[#0F3D3E]/90 text-white min-w-[140px]"
          >
            Save Preferences
          </Button>
        </div>
      </form>
    </div>
  );
}