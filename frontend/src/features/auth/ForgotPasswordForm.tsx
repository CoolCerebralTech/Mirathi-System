// src/features/auth/ForgotPasswordForm.tsx
// ============================================================================
// Forgot Password Form Feature Component
// ============================================================================
// - Manages the state and logic for initiating the password reset process.
// - Provides a simple interface for the user to submit their email address.
// - Calls the `forgotPassword` function from the API service.
// - Displays a consistent success message regardless of whether the email
//   exists in the system, which is a key security practice to prevent
//   user enumeration attacks.
// ============================================================================

import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { forgotPassword } from '../../api/auth';
import { ForgotPasswordRequest } from '../../types/api';

export const ForgotPasswordForm = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordRequest>();

  const onSubmit: SubmitHandler<ForgotPasswordRequest> = async (data) => {
    try {
      await forgotPassword(data);
    } catch (error) {
      // For security, we don't show specific errors.
      // We just proceed as if it was successful.
      console.error('Forgot password request failed:', error);
    } finally {
      setIsSubmitted(true);
    }
  };

  if (isSubmitted) {
    return (
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900">Request Sent</h3>
        <p className="mt-2 text-sm text-gray-600">
          If an account with that email exists, a password reset link has been sent. Please check your inbox.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Input
        label="Email address"
        type="email"
        {...register('email', {
          required: 'Email is required',
          pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' },
        })}
        error={errors.email?.message}
      />
      
      <div>
        <Button type="submit" loading={isSubmitting}>
          Send Reset Link
        </Button>
      </div>
    </form>
  );
};