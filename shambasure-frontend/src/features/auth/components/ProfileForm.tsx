// FILE: src/features/auth/components/ProfileForm.tsx

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';

import { UpdateUserProfileSchema, type UpdateUserProfileInput } from '../../../types';
import { useProfile, useUpdateProfile } from '../auth.api'; // Fetch/Update profile data

import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import { Textarea } from '../../../components/ui/Textarea'; // For the bio field
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../../components/ui/Card';
import { toast } from '../../../hooks/useToast';
import { useAuthStore } from '../../../store/auth.store'; // To check auth status

export function ProfileForm() {
  const { status } = useAuthStore();
  const { data: userProfile, isLoading: isProfileLoading, isError: isProfileError } = useProfile(status === 'authenticated');
  const updateProfileMutation = useUpdateProfile();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<UpdateUserProfileInput>({
    resolver: zodResolver(UpdateUserProfileSchema),
    mode: 'onChange', // Validate on change to enable/disable Save button
  });

  // Hydrate form with data once loaded or reset when userProfile changes
  useEffect(() => {
    if (userProfile && userProfile.profile) {
      reset({
        bio: userProfile.profile.bio || '',
        phoneNumber: userProfile.profile.phoneNumber || '',
        address: userProfile.profile.address || {},
        nextOfKin: userProfile.profile.nextOfKin || {},
      });
    }
  }, [userProfile, reset]);

  const onSubmit = (data: UpdateUserProfileInput) => {
    updateProfileMutation.mutate(data, {
      onSuccess: () => {
        toast.success('Profile updated successfully!');
        reset(data); // Reset form dirty state after successful save
      },
      onError: (error: any) => {
        const errorMessage = error.response?.data?.message || 'Failed to update profile. Please try again.';
        toast.error('Update Failed', {
          description: errorMessage,
        });
      },
    });
  };

  if (isProfileLoading) {
    return (
        <Card className="p-6 text-center">
            <p>Loading profile...</p>
        </Card>
    ); // Or a skeleton loader
  }

  if (isProfileError || !userProfile) {
    return (
        <Card className="p-6 text-center">
            <p className="text-destructive">Failed to load profile. Please try again.</p>
        </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Update Profile</CardTitle>
        <CardDescription>Update your personal information and contact details.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="Tell us about yourself..."
              rows={4}
              {...register('bio')}
              disabled={updateProfileMutation.isLoading}
            />
            {errors.bio && <p className="text-sm text-destructive">{errors.bio.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input
              id="phoneNumber"
              type="tel" // Using 'tel' for better mobile experience
              placeholder="+2547XXXXXXXX"
              {...register('phoneNumber')}
              disabled={updateProfileMutation.isLoading}
            />
            {errors.phoneNumber && <p className="text-sm text-destructive">{errors.phoneNumber.message}</p>}
          </div>

          {/* Address fields (nested object) */}
          <div className="space-y-4 rounded-md border p-4">
            <p className="font-semibold">Address</p>
            <div className="space-y-2">
              <Label htmlFor="street">Street</Label>
              <Input
                id="street"
                placeholder="123 Shamba Lane"
                {...register('address.street')}
                disabled={updateProfileMutation.isLoading}
              />
              {errors.address?.street && <p className="text-sm text-destructive">{errors.address.street.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" placeholder="Nairobi" {...register('address.city')} disabled={updateProfileMutation.isLoading} />
                    {errors.address?.city && <p className="text-sm text-destructive">{errors.address.city.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="postCode">Post Code</Label>
                    <Input id="postCode" placeholder="00100" {...register('address.postCode')} disabled={updateProfileMutation.isLoading} />
                    {errors.address?.postCode && <p className="text-sm text-destructive">{errors.address.postCode.message}</p>}
                </div>
            </div>
             <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                placeholder="Kenya"
                {...register('address.country')}
                disabled={updateProfileMutation.isLoading}
              />
              {errors.address?.country && <p className="text-sm text-destructive">{errors.address.country.message}</p>}
            </div>
          </div>

          {/* Next of Kin fields (nested object) */}
          <div className="space-y-4 rounded-md border p-4">
            <p className="font-semibold">Next of Kin</p>
            <div className="space-y-2">
              <Label htmlFor="nok-fullName">Full Name</Label>
              <Input
                id="nok-fullName"
                placeholder="Jane Mwangi"
                {...register('nextOfKin.fullName')}
                disabled={updateProfileMutation.isLoading}
              />
              {errors.nextOfKin?.fullName && <p className="text-sm text-destructive">{errors.nextOfKin.fullName.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="nok-relationship">Relationship</Label>
              <Input
                id="nok-relationship"
                placeholder="Spouse"
                {...register('nextOfKin.relationship')}
                disabled={updateProfileMutation.isLoading}
              />
              {errors.nextOfKin?.relationship && <p className="text-sm text-destructive">{errors.nextOfKin.relationship.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="nok-phoneNumber">Phone Number</Label>
              <Input
                id="nok-phoneNumber"
                type="tel"
                placeholder="+2547XXXXXXXX"
                {...register('nextOfKin.phoneNumber')}
                disabled={updateProfileMutation.isLoading}
              />
              {errors.nextOfKin?.phoneNumber && <p className="text-sm text-destructive">{errors.nextOfKin.phoneNumber.message}</p>}
            </div>
          </div>

          <CardFooter className="flex justify-end p-0 pt-6">
            <Button type="submit" disabled={updateProfileMutation.isLoading || !isDirty}>
              {updateProfileMutation.isLoading ? 'Saving Changes...' : 'Save Changes'}
            </Button>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  );
}