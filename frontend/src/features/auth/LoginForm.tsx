// src/features/auth/LoginForm.tsx
// ============================================================================
// Login Form Feature Component
// ============================================================================
// - Manages the entire state and logic for the user login process.
// - Uses `react-hook-form` for efficient form handling and validation.
// - Calls the `login` function from our API service on submission.
// - Handles loading and error states, providing feedback to the user.
// - Navigates the user to the dashboard upon successful login.
// ============================================================================

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { login } from '../../api/auth';
import type { LoginRequest } from '../../types/api';

export const LoginForm = () => {
  const [apiError, setApiError] = useState<string | null>(null);
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginRequest>();

  const onSubmit: SubmitHandler<LoginRequest> = async (data) => {
    setApiError(null); // Reset previous errors
    try {
      await login(data);
      navigate('/dashboard'); // Redirect to dashboard on success
    } catch (error: any) {
      // Set an error message to display to the user
      const message = error.response?.data?.message || 'Login failed. Please check your credentials.';
      setApiError(message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {apiError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{apiError}</span>
        </div>
      )}
      <Input
        label="Email address"
        type="email"
        {...register('email', {
          required: 'Email is required',
          pattern: {
            value: /^\S+@\S+$/i,
            message: 'Invalid email address',
          },
        })}
        error={errors.email?.message}
      />

      <Input
        label="Password"
        type="password"
        {...register('password', {
          required: 'Password is required',
        })}
        error={errors.password?.message}
      />
      
      <div>
        <Button type="submit" loading={isSubmitting}>
          Sign in
        </Button>
      </div>

      <div className="flex items-center justify-end">
  <div className="text-sm">
      <Link to="/forgot-password" className="font-medium text-indigo-600 hover:text-indigo-500">
        Forgot your password?
      </Link>
    </div>
  </div>
    </form>
  );
};