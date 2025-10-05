// src/features/auth/RegisterForm.tsx
// ============================================================================
// Registration Form Feature Component
// ============================================================================
// - Manages state and logic for new user registration.
// - Utilizes `react-hook-form` for robust validation, including password matching.
// - Calls the `register` function from our API service upon submission.
// - Handles API-side errors (e.g., email already exists) and displays them.
// - Navigates the user to the dashboard upon successful registration, logging
//   them in automatically.
// ============================================================================

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { register as registerUser } from '../../api/auth';
import type { RegisterRequest } from '../../types/api';

// We add a `confirmPassword` field for validation, which is not part of the API request.
type RegisterFormInputs = RegisterRequest & {
  confirmPassword?: string;
};

export const RegisterForm = () => {
  const [apiError, setApiError] = useState<string | null>(null);
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormInputs>();

  // `watch` allows us to check the value of the password field for the confirmation check.
  const password = watch('password');

  const onSubmit: SubmitHandler<RegisterFormInputs> = async (data) => {
    setApiError(null);
    try {
      await registerUser(data);
      navigate('/dashboard'); // Redirect to dashboard on success
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed. Please try again.';
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
      
      <div className="flex flex-col md:flex-row md:space-x-4">
        <Input
          label="First Name"
          type="text"
          {...register('firstName', { required: 'First name is required' })}
          error={errors.firstName?.message}
        />
        <Input
          label="Last Name"
          type="text"
          {...register('lastName', { required: 'Last name is required' })}
          error={errors.lastName?.message}
        />
      </div>

      <Input
        label="Email address"
        type="email"
        {...register('email', {
          required: 'Email is required',
          pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' },
        })}
        error={errors.email?.message}
      />

      <Input
        label="Password"
        type="password"
        {...register('password', {
          required: 'Password is required',
          minLength: { value: 8, message: 'Password must be at least 8 characters' },
        })}
        error={errors.password?.message}
      />

      <Input
        label="Confirm Password"
        type="password"
        {...register('confirmPassword', {
          required: 'Please confirm your password',
          validate: (value) => value === password || 'The passwords do not match',
        })}
        error={errors.confirmPassword?.message}
      />
      
      <div>
        <Button type="submit" loading={isSubmitting}>
          Create Account
        </Button>
      </div>
    </form>
  );
};