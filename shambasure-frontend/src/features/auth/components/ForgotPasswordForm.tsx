// FILE: src/features/auth/components/ForgotPasswordForm.tsx

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';

import { ForgotPasswordSchema, type ForgotPasswordInput } from '../../../types';
import { useForgotPassword } from '../auth.api';

import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card';
import { toast } from '../../../hooks/useToast';

export function ForgotPasswordForm() {
  const forgotPasswordMutation = useForgotPassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(ForgotPasswordSchema),
  });

  const onSubmit = (data: ForgotPasswordInput) => {
    forgotPasswordMutation.mutate(data, {
      onSuccess: (response: any) => {
        // We show the generic success message from the API for security.
        toast.info('Password Reset Initiated', {
          description: response.message,
        });
      },
      onError: (error: any) => {
        const errorMessage = error.response?.data?.message || 'An error occurred. Please try again.';
        toast.error('Request Failed', {
          description: errorMessage,
        });
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Forgot Password</CardTitle>
        <CardDescription>
          Enter your email address and we'll send you a link to reset your password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              {...register('email')}
              disabled={forgotPasswordMutation.isLoading}
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={forgotPasswordMutation.isLoading}>
            {forgotPasswordMutation.isLoading ? 'Sending...' : 'Send Reset Link'}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm">
          <Link to="/login" className="font-medium text-primary hover:underline">
            Back to Sign In
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}