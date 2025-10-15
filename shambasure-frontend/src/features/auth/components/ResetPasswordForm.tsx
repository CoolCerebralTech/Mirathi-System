// FILE: src/features/auth/components/ResetPasswordForm.tsx

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Lock } from 'lucide-react';
import { toast } from 'sonner';

import { ResetPasswordSchema, type ResetPasswordInput } from '../../../types';
import { useResetPassword } from '../auth.api';
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

/**
 * A form for users to reset their password using a token from their email.
 */
export function ResetPasswordForm() {
  const { t } = useTranslation(['auth', 'validation', 'common']);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { mutate: resetPassword, isPending } = useResetPassword();

  const token = searchParams.get('token') ?? '';

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: {
      token,
      newPassword: '',
      confirmNewPassword: '',
    },
  });

  // Ensure the token from the URL is always in the form state
  useEffect(() => {
    if (token) {
      setValue('token', token);
    }
  }, [token, setValue]);

  const onSubmit = (formData: ResetPasswordInput) => {
    resetPassword(formData, {
      onSuccess: () => {
        toast.success(t('auth:password_reset_success_title'), {
          description: t('auth:password_reset_success_description'),
        });
        setTimeout(() => navigate('/login', { replace: true }), 2000);
      },
      onError: (error) => {
        toast.error(t('auth:password_reset_failed_title'), {
          description: extractErrorMessage(error),
        });
      },
    });
  };

  if (!token) {
    return (
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle>{t('auth:invalid_reset_link')}</CardTitle>
          <CardDescription>
            {t('auth:invalid_reset_link_description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => navigate('/forgot-password')}
            className="w-full"
          >
            {t('auth:request_new_reset_link')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{t('auth:reset_password')}</CardTitle>
        <CardDescription>
          {t('auth:reset_password_description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <input type="hidden" {...register('token')} />

          <div className="space-y-2">
            <Label htmlFor="newPassword">{t('auth:new_password')}</Label>
            <Input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              leftIcon={<Lock className="text-muted-foreground" size={16} />}
              disabled={isPending}
              aria-invalid={!!errors.newPassword}
              aria-describedby="newPassword-error"
              {...register('newPassword')}
            />
            {errors.newPassword && (
              <p id="newPassword-error" className="text-sm text-destructive">
                {errors.newPassword.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmNewPassword">{t('auth:confirm_new_password')}</Label>
            <Input
              id="confirmNewPassword"
              type="password"
              autoComplete="new-password"
              leftIcon={<Lock className="text-muted-foreground" size={16} />}
              disabled={isPending}
              aria-invalid={!!errors.confirmNewPassword}
              aria-describedby="confirmNewPassword-error"
              {...register('confirmNewPassword')}
            />
            {errors.confirmNewPassword && (
              <p id="confirmNewPassword-error" className="text-sm text-destructive">
                {errors.confirmNewPassword.message}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" isLoading={isPending}>
            {t('auth:set_new_password')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}