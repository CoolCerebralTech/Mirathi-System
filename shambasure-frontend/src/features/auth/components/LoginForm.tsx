// FILE: src/features/auth/components/LoginForm.tsx

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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Checkbox } from '../../../components/ui/Checkbox';

export function LoginForm() {
  const { t } = useTranslation(['auth', 'common']);
  const navigate = useNavigate();
  const loginMutation = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginRequestSchema),
  });

  const onSubmit = (data: LoginInput) => {
    loginMutation.mutate(data, {
      onSuccess: () => {
        toast.success(t('auth:login_success'));
        navigate('/dashboard', { replace: true });
      },
      onError: (error) => {
        // SIMPLIFICATION: We can pass the error message directly to the toast description
        toast.error(t('auth:login_failed'), {
          description: extractErrorMessage(error),
        });
      },
    });
  };
  
  // FUNCTIONAL UPGRADE: Handle the "Remember Me" logic
  const handleRememberMeChange = (remember: boolean) => {
      // This tells our Zustand store which storage to use on the *next* page load.
      localStorage.setItem('shamba-sure-storage-type', remember ? 'local' : 'session');
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{t('auth:welcome_back')}</CardTitle>
        <CardDescription>{t('auth:sign_in_prompt')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="email">{t('auth:email')}</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              leftIcon={<Mail size={16} />}
              error={errors.email?.message}
              disabled={loginMutation.isPending}
              {...register('email')}
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">{t('auth:password')}</Label>
              <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                {t('auth:forgot_password')}
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              leftIcon={<Lock size={16} />}
              error={errors.password?.message}
              disabled={loginMutation.isPending}
              {...register('password')}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="remember"
              onCheckedChange={(checked) => handleRememberMeChange(checked as boolean)}
              disabled={loginMutation.isPending}
            />
            <Label htmlFor="remember" className="font-normal">
              {t('auth:remember_me')}
            </Label>
          </div>

          <Button type="submit" className="w-full" isLoading={loginMutation.isPending}>
            {t('auth:sign_in')}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm">
          {t('auth:no_account')}{' '}
          <Link to="/register" className="font-medium text-primary hover:underline">
            {t('auth:sign_up_now')}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}