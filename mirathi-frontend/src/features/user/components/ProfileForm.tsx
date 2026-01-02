import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { User, Phone, MapPin, Save, Loader2 } from 'lucide-react';

import { 
  UpdateProfileInputSchema, 
  type UpdateProfileInput 
} from '../../../types/user.types';
import { 
  KenyanCountySchema, 
  COUNTY_LABELS, 
  type KenyanCounty // <--- Import the type
} from '../../../types/shared.types';
import { useCurrentUser, useUpdateProfile } from '../user.api';

import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/Select';

export function ProfileForm() {
  const { t } = useTranslation(['profile', 'common']);
  const { data: user, isLoading: isLoadingUser } = useCurrentUser();
  const { mutate: updateProfile, isPending: isSaving } = useUpdateProfile();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isDirty },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(UpdateProfileInputSchema),
  });

  // Hydrate form when user data loads
  useEffect(() => {
    if (user?.profile) {
      reset({
        firstName: user.profile.firstName || '',
        lastName: user.profile.lastName || '',
        phoneNumber: user.profile.phoneNumber || '',
        physicalAddress: user.profile.physicalAddress || '',
        county: user.profile.county || undefined,
      });
    }
  }, [user, reset]);

  const onSubmit = (data: UpdateProfileInput) => {
    updateProfile(data, {
      onSuccess: (updatedUser) => {
        reset({
          firstName: updatedUser.profile?.firstName,
          lastName: updatedUser.profile?.lastName,
          phoneNumber: updatedUser.profile?.phoneNumber || '',
          physicalAddress: updatedUser.profile?.physicalAddress || '',
          county: updatedUser.profile?.county || undefined,
        });
      }
    });
  };

  if (isLoadingUser) {
    return (
      <div className="p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-amber-500"/>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      
      {/* SECTION 1: PERSONAL DETAILS */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-slate-200 flex items-center gap-2">
          <User className="h-5 w-5 text-amber-500" />
          {t('profile:personal_details', 'Personal Details')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">{t('profile:first_name', 'First Name')}</Label>
            <Input 
              id="firstName" 
              {...register('firstName')} 
              disabled={isSaving}
              error={errors.firstName?.message} 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">{t('profile:last_name', 'Last Name')}</Label>
            <Input 
              id="lastName" 
              {...register('lastName')} 
              disabled={isSaving}
              error={errors.lastName?.message}
            />
          </div>
        </div>
      </div>

      <div className="border-t border-slate-800" />

      {/* SECTION 2: CONTACT INFO */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-slate-200 flex items-center gap-2">
          <Phone className="h-5 w-5 text-amber-500" />
          {t('profile:contact_info', 'Contact Information')}
        </h3>
        
        <div className="space-y-2">
          <Label htmlFor="phoneNumber">{t('profile:phone_number', 'Phone Number')}</Label>
          <Input 
            id="phoneNumber" 
            placeholder="+254..." 
            {...register('phoneNumber')} 
            disabled={isSaving}
            error={errors.phoneNumber?.message}
          />
          <p className="text-xs text-slate-500">Used for important account notifications and MFA.</p>
        </div>
      </div>

      <div className="border-t border-slate-800" />

      {/* SECTION 3: LOCATION */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-slate-200 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-amber-500" />
          {t('profile:location', 'Location')}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>{t('profile:county', 'County')}</Label>
            <Select 
              // ✅ FIX: Cast strictly to KenyanCounty instead of any
              onValueChange={(val) => setValue('county', val as KenyanCounty, { shouldDirty: true })}
              defaultValue={user?.profile?.county || undefined}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select County" />
              </SelectTrigger>
              <SelectContent>
                {KenyanCountySchema.options.map((county) => (
                  <SelectItem key={county} value={county}>
                    {COUNTY_LABELS[county]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="physicalAddress">{t('profile:physical_address', 'Physical Address')}</Label>
            <Input 
              id="physicalAddress" 
              {...register('physicalAddress')} 
              disabled={isSaving}
              error={errors.physicalAddress?.message}
            />
          </div>
        </div>
      </div>

      {/* ACTIONS */}
      <div className="flex justify-end pt-4">
        <Button 
          type="submit" 
          disabled={!isDirty || isSaving}
          isLoading={isSaving}
          className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold"
        >
          <Save className="h-4 w-4 mr-2" />
          {t('common:save_changes', 'Save Changes')}
        </Button>
      </div>
    </form>
  );
}