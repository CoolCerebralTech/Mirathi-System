// FILE: src/features/auth/components/LoginForm.tsx

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, Lock } from 'lucide-react';
import { toast } from 'sonner';

import { LoginRequestSchema, type LoginInput } from '../../../types';
import { useLogin } from '../auth.api';
import { extractErrorMessage } from '../../../api/client';

import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/Card';
import { Checkbox } from '../../../components/ui/Checkbox';

/**
 * A form component for user authentication.
 * Handles user input, validation, and submission for the login process.
 */
export function LoginForm() {
  const { t } = useTranslation(['auth', 'validation']);
  const navigate = useNavigate();
  const { mutate: login, isPending } = useLogin();
  const [rememberMe, setRememberMe] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginRequestSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = (formData: LoginInput) => {
    login(
      { data: formData, rememberMe },
      {
        onSuccess: () => {
          toast.success(t('auth:login_success'));
          navigate('/dashboard', { replace: true });
        },
        onError: (error) => {
          toast.error(t('auth:login_failed_title'), {
            description: extractErrorMessage(error),
          });
        },
      },
    );
  };

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{t('auth:welcome_back')}</CardTitle>
        <CardDescription>{t('auth:sign_in_prompt')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">{t('auth:email')}</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              autoComplete="email"
              leftIcon={<Mail className="text-muted-foreground" size={16} />}
              disabled={isPending}
              aria-invalid={!!errors.email}
              aria-describedby="email-error"
              {...register('email')}
            />
            {errors.email && (
              <p id="email-error" className="text-sm text-destructive">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">{t('auth:password')}</Label>
              <Link
                to="/forgot-password"
                className="text-sm font-medium text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
              >
                {t('auth:forgot_password')}
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              leftIcon={<Lock className="text-muted-foreground" size={16} />}
              disabled={isPending}
              aria-invalid={!!errors.password}
              aria-describedby="password-error"
              {...register('password')}
            />
            {errors.password && (
              <p id="password-error" className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="remember"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              disabled={isPending}
            />
            <Label htmlFor="remember" className="cursor-pointer select-none font-normal">
              {t('auth:remember_me')}
            </Label>
          </div>

          <Button type="submit" className="w-full" isLoading={isPending}>
            {t('auth:sign_in')}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t('auth:no_account')}{' '}
          <Link
            to="/register"
            className="font-semibold text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
          >
            {t('auth:sign_up_now')}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}