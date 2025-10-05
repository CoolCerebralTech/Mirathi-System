// src/features/auth/ResetPasswordForm.tsx
// ============================================================================
// Reset Password Form Feature Component
// ============================================================================
// - Allows a user to set a new password using a token from their email.
// - Extracts the reset token from the URL's query parameters.
// - Provides fields for a new password and confirmation with validation.
// - Calls the `resetPassword` API function on submission.
// - Manages loading, success, and error states (e.g., "Invalid Token").
// ============================================================================

import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { resetPassword } from '../../api/auth';
import { ResetPasswordRequest } from '../../types/api';
import { Link } from 'react-router-dom';

type ResetPasswordFormInputs = ResetPasswordRequest & {
    confirmPassword?: string;
};

export const ResetPasswordForm = () => {
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormInputs>();

  const password = watch('newPassword');

  const onSubmit: SubmitHandler<ResetPasswordFormInputs> = async (data) => {
    if (!token) {
        setApiError("No reset token found. Please request a new link.");
        return;
    }
    setApiError(null);
    try {
      await resetPassword({ token, newPassword: data.newPassword });
      setIsSuccess(true);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Password reset failed. The link may have expired.';
      setApiError(message);
    }
  };
  
  if (isSuccess) {
    return (
      <div className="text-center">
        <h3 className="text-lg font-medium text-green-800">Password Reset Successfully!</h3>
        <p className="mt-2 text-sm text-gray-600">
          You can now use your new password to sign in.
        </p>
        <div className="mt-4">
            <Link to="/login" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
                Go to Login
            </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {!token && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
            Missing reset token. Please ensure you've used the correct link from your email.
        </div>
      )}
      {apiError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {apiError}
        </div>
      )}
      <Input
        label="New Password"
        type="password"
        {...register('newPassword', {
          required: 'Password is required',
          minLength: { value: 8, message: 'Password must be at least 8 characters' },
        })}
        error={errors.newPassword?.message}
      />
      <Input
        label="Confirm New Password"
        type="password"
        {...register('confirmPassword', {
          required: 'Please confirm your password',
          validate: (value) => value === watch('newPassword') || 'The passwords do not match',
        })}
        error={errors.confirmPassword?.message}
      />
      <div>
        <Button type="submit" loading={isSubmitting} disabled={!token}>
          Set New Password
        </Button>
      </div>
    </form>
  );
};