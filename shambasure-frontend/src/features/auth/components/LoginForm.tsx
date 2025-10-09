// FILE: src/features/auth/components/LoginForm.tsx

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, Lock } from 'lucide-react';

import { LoginSchema, type LoginInput } from '../../../types/schemas';
import { useLogin } from '../auth.api';
import { toast } from '../../../components/common/Toaster';
import { extractErrorMessage } from '../../../api/client';

import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Checkbox } from '../../../components/ui/Checkbox';

export function LoginForm() {
  const { t } = useTranslation(['auth', 'common']);
  const navigate = useNavigate();
  const loginMutation = useLogin();
  const [rememberMe, setRememberMe] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginInput) => {
    loginMutation.mutate(data, {
      onSuccess: () => {
        toast.success(t('auth:login_success'));
        navigate('/dashboard');
      },
      onError: (error) => {
        toast.error(
          t('common:error'),
          extractErrorMessage(error)
        );
      },
    });
  };

  const isLoading = isSubmitting || loginMutation.isPending;

  return (
    <Card className="w-full">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">{t('auth:welcome_back')}</CardTitle>
        <CardDescription>
          {t('auth:sign_in')} to access your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email">{t('auth:email')}</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              leftIcon={<Mail className="h-4 w-4" />}
              error={errors.email?.message}
              disabled={isLoading}
              {...register('email')}
            />
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">{t('auth:password')}</Label>
              <Link
                to="/forgot-password"
                className="text-sm font-medium text-primary hover:underline"
                tabIndex={-1}
              >
                {t('auth:forgot_password')}
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              leftIcon={<Lock className="h-4 w-4" />}
              error={errors.password?.message}
              disabled={isLoading}
              {...register('password')}
            />
          </div>

          {/* Remember Me */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="remember"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              disabled={isLoading}
            />
            <Label
              htmlFor="remember"
              className="text-sm font-normal cursor-pointer"
            >
              {t('auth:remember_me')}
            </Label>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            isLoading={isLoading}
            disabled={isLoading}
          >
            {t('auth:sign_in')}
          </Button>
        </form>

        {/* Sign Up Link */}
        <div className="mt-6 text-center text-sm">
          <span className="text-muted-foreground">{t('auth:no_account')} </span>
          <Link
            to="/register"
            className="font-medium text-primary hover:underline"
          >
            {t('auth:sign_up')}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}