// src/features/profile/UpdateProfileForm.tsx
// ============================================================================
// Update Profile Form Feature Component
// ============================================================================
// - Allows authenticated users to view and update their profile information.
// - Fetches existing user data on component mount to pre-fill the form.
// - Handles form submission to update user profile via the API service.
// - Manages loading, success, and error states for a clear user experience.
// ============================================================================

import { useForm, type SubmitHandler } from 'react-hook-form';
import { useAuthStore } from '../../store/auth.store';
import { updateProfile } from '../../api/profile';
import type { UpdateUserProfileRequest, User } from '../../types/api';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useEffect, useState } from 'react';

export const UpdateProfileForm = () => {
  const user = useAuthStore((state) => state.user);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateUserProfileRequest>();

  // Pre-fill the form with the user's current data when the component loads.
  useEffect(() => {
    if (user) {
      reset({
        // We'll need to expand this once we have the full User object shape
        // For now, let's just imagine we have these fields on the profile
        bio: (user as any).profile?.bio || '', 
        phoneNumber: (user as any).profile?.phoneNumber || '',
      });
    }
  }, [user, reset]);

  const onSubmit: SubmitHandler<UpdateUserProfileRequest> = async (data) => {
    setSuccessMessage(null);
    try {
      await updateProfile(data);
      setSuccessMessage('Profile updated successfully!');
      // Here we would also update the user object in our Zustand store
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h3 className="text-lg font-medium leading-6 text-gray-900">Personal Information</h3>
       {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
            {successMessage}
        </div>
       )}
      <Input
        label="Email"
        type="email"
        defaultValue={user?.email}
        disabled // Email is usually not updatable via this form
      />
       <Input
        label="Phone Number"
        type="tel"
        {...register('phoneNumber')}
        error={errors.phoneNumber?.message}
      />
      {/* We can add more fields like Bio, Address, Next of Kin here */}
      <div className="pt-2">
        <Button type="submit" loading={isSubmitting}>
          Save Changes
        </Button>
      </div>
    </form>
  );
};