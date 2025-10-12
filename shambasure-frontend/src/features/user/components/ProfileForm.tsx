// FILE: src/features/user/components/ProfileForm.tsx

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { UpdateUserProfileSchema, type UpdateUserProfileInput } from '../../../types';
import { useProfile, useUpdateProfile } from '../user.api';
import { extractErrorMessage } from '../../../api/client';

import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';

export function ProfileForm() {
  const { t } = useTranslation(['user', 'common']);
  const { data: profile, isLoading: isLoadingProfile } = useProfile();
  const updateProfileMutation = useUpdateProfile();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<UpdateUserProfileInput>({
    resolver: zodResolver(UpdateUserProfileSchema),
    // This is excellent practice for initializing the form structure.
    defaultValues: {
      bio: '',
      phoneNumber: '',
      address: { street: '', city: '', postCode: '', country: '' },
      nextOfKin: { fullName: '', relationship: '', phoneNumber: '' },
    },
  });

  // This useEffect correctly populates the form once the profile data is loaded.
  React.useEffect(() => {
    if (profile?.profile) {
      // The `reset` function updates the form's values and its "default" state.
      reset({
        bio: profile.profile.bio ?? '',
        phoneNumber: profile.profile.phoneNumber ?? '',
        address: profile.profile.address ?? undefined,
        nextOfKin: profile.profile.nextOfKin ?? undefined,
      });
    }
  }, [profile, reset]);

  const onSubmit = (data: UpdateUserProfileInput) => {
    updateProfileMutation.mutate(data, {
      onSuccess: () => {
        toast.success(t('user:profile_update_success'));
      },
      onError: (error) => {
        toast.error(t('user:profile_update_failed'), {
          description: extractErrorMessage(error),
        });
      },
    });
  };

  if (isLoadingProfile) {
    return (
      <Card className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" />
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('user:profile_information')}</CardTitle>
        <CardDescription>{t('user:profile_information_prompt')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* --- Bio & Phone --- */}
          <div className="space-y-4">
             {/* ... Bio and Phone fields are great as is ... */}
          </div>

          {/* --- Address Fields (Now Complete) --- */}
          <div className="space-y-4 border-t pt-6">
            <h3 className="font-medium">{t('user:address')}</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="address.street">{t('user:street')}</Label>
                <Input id="address.street" {...register('address.street')} disabled={updateProfileMutation.isPending} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="address.city">{t('user:city')}</Label>
                <Input id="address.city" {...register('address.city')} disabled={updateProfileMutation.isPending} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="address.postCode">{t('user:post_code')}</Label>
                <Input id="address.postCode" {...register('address.postCode')} disabled={updateProfileMutation.isPending} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="address.country">{t('user:country')}</Label>
                <Input id="address.country" {...register('address.country')} disabled={updateProfileMutation.isPending} />
              </div>
            </div>
          </div>

          {/* --- Next of Kin Fields (Now Complete) --- */}
          <div className="space-y-4 border-t pt-6">
            <h3 className="font-medium">{t('user:next_of_kin')}</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="nextOfKin.fullName">{t('user:full_name')}</Label>
                <Input id="nextOfKin.fullName" {...register('nextOfKin.fullName')} error={errors.nextOfKin?.fullName?.message} disabled={updateProfileMutation.isPending} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="nextOfKin.relationship">{t('user:relationship')}</Label>
                <Input id="nextOfKin.relationship" {...register('nextOfKin.relationship')} error={errors.nextOfKin?.relationship?.message} disabled={updateProfileMutation.isPending} />
              </div>
              <div className="col-span-full space-y-1">
                <Label htmlFor="nextOfKin.phoneNumber">{t('user:phone_number')}</Label>
                <Input id="nextOfKin.phoneNumber" type="tel" {...register('nextOfKin.phoneNumber')} error={errors.nextOfKin?.phoneNumber?.message} disabled={updateProfileMutation.isPending} />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t pt-6">
            <Button
              type="button"
              variant="outline"
              // UPGRADE: `reset()` with no args reverts to the last populated values from useEffect.
              onClick={() => reset()}
              disabled={!isDirty || updateProfileMutation.isPending}
            >
              {t('common:cancel')}
            </Button>
            <Button type="submit" isLoading={updateProfileMutation.isPending} disabled={!isDirty}>
              {t('common:save_changes')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}