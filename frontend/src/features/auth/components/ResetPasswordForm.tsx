// FILE: src/features/auth/components/ResetPasswordForm.tsx

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';

import { ResetPasswordSchema, type ResetPasswordInput } from '../../../types';
import { useResetPassword } from '../auth.api';

import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card';
import { toast } from '../../../hooks/useToast';

export function ResetPasswordForm() {
  const navigate = useNavigate();
  const resetPasswordMutation = useResetPassword();
  
  // `useSearchParams` is a hook from react-router-dom to read URL query parameters.
  // We expect a URL like /reset-password?token=...
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: {
      token: token || '',
    },
  });

  // This effect syncs the token from the URL to our form state.
  useEffect(() => {
    if (token) {
      setValue('token', token);
    }
  }, [token, setValue]);

  const onSubmit = (data: ResetPasswordInput) => {
    if (!data.token) {
        toast.error('Missing Token', { description: 'The password reset token is missing from the URL.' });
        return;
    }

    resetPasswordMutation.mutate(data, {
      onSuccess: (response: any) => {
        toast.success('Password Reset Successful', {
          description: response.message,
        });
        navigate('/login'); // Redirect to login page after successful reset
      },
      onError: (error: any) => {
        const errorMessage = error.response?.data?.message || 'Invalid or expired token. Please try again.';
        toast.error('Reset Failed', {
          description: errorMessage,
        });
      },
    });
  };
  
  // If no token is present in the URL, we can show an error state.
  if (!token) {
      return (
          <Card>
              <CardHeader>
                  <CardTitle>Invalid Reset Link</CardTitle>
                  <CardDescription>
                      The password reset link is invalid or has expired. Please request a new one.
                  </CardDescription>
              </CardHeader>
              <CardContent>
                  <Button asChild className="w-full">
                      <Link to="/forgot-password">Request New Link</Link>
                  </Button>
              </CardContent>
          </Card>
      );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Set New Password</CardTitle>
        <CardDescription>Please enter your new password below.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* The token field is hidden, but its value is part of the form state */}
          <input type="hidden" {...register('token')} />

          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              {...register('newPassword')}
              disabled={resetPasswordMutation.isLoading}
            />
            {errors.newPassword && <p className="text-sm text-destructive">{errors.newPassword.message}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={resetPasswordMutation.isLoading}>
            {resetPasswordMutation.isLoading ? 'Resetting...' : 'Reset Password'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}