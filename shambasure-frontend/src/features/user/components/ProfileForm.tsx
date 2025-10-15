// FILE: src/features/user/components/ProfileForm.tsx

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import {
  UpdateUserProfileSchema,
  type UpdateUserProfileInput,
} from '../../../types';
import { useProfile, useUpdateProfile } from '../user.api';
import { extractErrorMessage } from '../../../api/client';

import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import { Textarea } from '../../../components/ui/Textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '../../../components/ui/Card';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';

/**
 * A form for users to view and update their detailed profile information,
 * including bio, contact details, address, and next of kin.
 */
export function ProfileForm() {
  const { t } = useTranslation(['user', 'validation', 'common']);
  const { data: user, isLoading: isLoadingProfile } = useProfile();
  const { mutate: updateProfile, isPending } = useUpdateProfile();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<UpdateUserProfileInput>({
    resolver: zodResolver(UpdateUserProfileSchema),
    defaultValues: {
      bio: '',
      phoneNumber: '',
      address: { street: '', city: '', postCode: '', country: '' },
      nextOfKin: { fullName: '', relationship: '', phoneNumber: '' },
    },
  });

  /**
   * This effect synchronizes the form state with the fetched user profile data.
   * When the `user` data arrives from the API, `reset` is called to populate
   * the form fields with the current values. This also updates the form's
   * "default values", so `isDirty` will correctly track changes against the
   * fetched data.
   */
  React.useEffect(() => {
    if (user?.profile) {
      reset({
        bio: user.profile.bio ?? '',
        phoneNumber: user.profile.phoneNumber ?? '',
        address: user.profile.address ?? undefined,
        nextOfKin: user.profile.nextOfKin ?? undefined,
      });
    }
  }, [user, reset]);

  const onSubmit = (formData: UpdateUserProfileInput) => {
    updateProfile(formData, {
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
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>{t('user:profile_information')}</CardTitle>
          <CardDescription>
            {t('user:profile_information_prompt')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* --- Bio & Phone --- */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bio">{t('user:bio')}</Label>
              <Textarea
                id="bio"
                rows={3}
                disabled={isPending}
                aria-invalid={!!errors.bio}
                aria-describedby="bio-error"
                {...register('bio')}
              />
              {errors.bio && (
                <p id="bio-error" className="text-sm text-destructive">
                  {errors.bio.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">{t('user:phone_number')}</Label>
              <Input
                id="phoneNumber"
                type="tel"
                disabled={isPending}
                aria-invalid={!!errors.phoneNumber}
                aria-describedby="phoneNumber-error"
                {...register('phoneNumber')}
              />
              {errors.phoneNumber && (
                <p id="phoneNumber-error" className="text-sm text-destructive">
                  {errors.phoneNumber.message}
                </p>
              )}
            </div>
          </div>

          {/* --- Address Fields --- */}
          <div className="space-y-4 border-t pt-6">
            <h3 className="font-medium">{t('user:address')}</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Fields are dynamically generated for consistency */}
              {(
                ['street', 'city', 'postCode', 'country'] as const
              ).map((field) => (
                <div key={field} className="space-y-2">
                  <Label htmlFor={`address.${field}`}>{t(`user:${field}`)}</Label>
                  <Input
                    id={`address.${field}`}
                    disabled={isPending}
                    {...register(`address.${field}`)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* --- Next of Kin Fields --- */}
          <div className="space-y-4 border-t pt-6">
            <h3 className="font-medium">{t('user:next_of_kin')}</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {(
                ['fullName', 'relationship', 'phoneNumber'] as const
              ).map((field) => (
                <div key={field} className="space-y-2 sm:col-span-1">
                  <Label htmlFor={`nextOfKin.${field}`}>
                    {t(`user:${field}`)}
                  </Label>
                  <Input
                    id={`nextOfKin.${field}`}
                    type={field === 'phoneNumber' ? 'tel' : 'text'}
                    disabled={isPending}
                    aria-invalid={!!errors.nextOfKin?.[field]}
                    aria-describedby={`nextOfKin.${field}-error`}
                    {...register(`nextOfKin.${field}`)}
                  />
                  {errors.nextOfKin?.[field] && (
                    <p
                      id={`nextOfKin.${field}-error`}
                      className="text-sm text-destructive"
                    >
                      {errors.nextOfKin?.[field]?.message}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => reset()}
            disabled={!isDirty || isPending}
          >
            {t('common:cancel')}
          </Button>
          <Button type="submit" isLoading={isPending} disabled={!isDirty}>
            {t('common:save_changes')}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
