// FILE: src/features/user/components/ProfileForm.tsx

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { User, Phone, MapPin } from 'lucide-react';

import { UpdateUserProfileSchema, type UpdateUserProfileInput } from '../../../types/schemas';
import { useProfile, useUpdateProfile } from '../user.api';
import { toast } from '../../../components/common/Toaster';
import { extractErrorMessage } from '../../../api/client';

import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import { Textarea } from '../../../components/ui/Textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';

export function ProfileForm() {
  const { t } = useTranslation(['common', 'auth']);
  const { data: profile, isLoading: isLoadingProfile } = useProfile();
  const updateProfileMutation = useUpdateProfile();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<UpdateUserProfileInput>({
    resolver: zodResolver(UpdateUserProfileSchema),
  });

  // Reset form when profile data loads
  React.useEffect(() => {
    if (profile?.profile) {
      reset({
        bio: profile.profile.bio || '',
        phoneNumber: profile.profile.phoneNumber || '',
        address: profile.profile.address || undefined,
        nextOfKin: profile.profile.nextOfKin || undefined,
      });
    }
  }, [profile, reset]);

  const onSubmit = async (data: UpdateUserProfileInput) => {
    updateProfileMutation.mutate(data, {
      onSuccess: () => {
        toast.success(t('common:success'), 'Profile updated successfully');
      },
      onError: (error) => {
        toast.error(
          t('common:error'),
          extractErrorMessage(error)
        );
      },
    });
  };

  if (isLoadingProfile) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </CardContent>
      </Card>
    );
  }

  const isLoading = isSubmitting || updateProfileMutation.isPending;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
        <CardDescription>
          Update your personal information and contact details
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Basic Information</h3>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Tell us about yourself..."
                error={errors.bio?.message}
                disabled={isLoading}
                {...register('bio')}
              />
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="+254 700 000000"
                leftIcon={<Phone className="h-4 w-4" />}
                error={errors.phoneNumber?.message}
                disabled={isLoading}
                {...register('phoneNumber')}
              />
            </div>
          </div>

          {/* Address */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Address</h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="address.street">Street</Label>
                <Input
                  id="address.street"
                  placeholder="123 Main St"
                  leftIcon={<MapPin className="h-4 w-4" />}
                  disabled={isLoading}
                  {...register('address.street')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address.city">City</Label>
                <Input
                  id="address.city"
                  placeholder="Nairobi"
                  disabled={isLoading}
                  {...register('address.city')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address.postCode">Postal Code</Label>
                <Input
                  id="address.postCode"
                  placeholder="00100"
                  disabled={isLoading}
                  {...register('address.postCode')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address.country">Country</Label>
                <Input
                  id="address.country"
                  placeholder="Kenya"
                  disabled={isLoading}
                  {...register('address.country')}
                />
              </div>
            </div>
          </div>

          {/* Next of Kin */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Next of Kin</h3>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nextOfKin.fullName">Full Name</Label>
                <Input
                  id="nextOfKin.fullName"
                  placeholder="Jane Doe"
                  leftIcon={<User className="h-4 w-4" />}
                  error={errors.nextOfKin?.fullName?.message}
                  disabled={isLoading}
                  {...register('nextOfKin.fullName')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nextOfKin.relationship">Relationship</Label>
                <Input
                  id="nextOfKin.relationship"
                  placeholder="Spouse, Sibling, Parent, etc."
                  error={errors.nextOfKin?.relationship?.message}
                  disabled={isLoading}
                  {...register('nextOfKin.relationship')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nextOfKin.phoneNumber">Phone Number</Label>
                <Input
                  id="nextOfKin.phoneNumber"
                  type="tel"
                  placeholder="+254 700 000000"
                  leftIcon={<Phone className="h-4 w-4" />}
                  error={errors.nextOfKin?.phoneNumber?.message}
                  disabled={isLoading}
                  {...register('nextOfKin.phoneNumber')}
                />
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => reset()}
              disabled={isLoading || !isDirty}
            >
              {t('common:cancel')}
            </Button>
            <Button
              type="submit"
              isLoading={isLoading}
              disabled={isLoading || !isDirty}
            >
              {t('common:save')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}