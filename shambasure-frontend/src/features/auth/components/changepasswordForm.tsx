// FILE: src/features/auth/components/ChangePasswordForm.tsx

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { ChangePasswordSchema, type ChangePasswordInput } from '../../../types';
import { useChangePassword } from '../auth.api';

import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../../components/ui/Card';
import { toast } from '../../../hooks/useToast';

export function ChangePasswordForm() {
  const changePasswordMutation = useChangePassword();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(ChangePasswordSchema),
  });

  const onSubmit = (data: ChangePasswordInput) => {
    changePasswordMutation.mutate(data, {
      onSuccess: () => {
        toast.success('Password changed successfully!');
        reset(); // Clear the form fields after successful change
      },
      onError: (error: any) => {
        const errorMessage = error.response?.data?.message || 'An incorrect password was provided or an error occurred.';
        toast.error('Failed to Change Password', {
          description: errorMessage,
        });
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change Password</CardTitle>
        <CardDescription>
          For your security, you must provide your current password to make this change.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input
              id="currentPassword"
              type="password"
              {...register('currentPassword')}
              disabled={changePasswordMutation.isLoading}
            />
            {errors.currentPassword && <p className="text-sm text-destructive">{errors.currentPassword.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              {...register('newPassword')}
              disabled={changePasswordMutation.isLoading}
            />
            {errors.newPassword && <p className="text-sm text-destructive">{errors.newPassword.message}</p>}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button type="submit" disabled={changePasswordMutation.isLoading}>
            {changePasswordMutation.isLoading ? 'Updating...' : 'Update Password'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}