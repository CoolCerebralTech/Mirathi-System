// FILE: src/features/auth/components/ResetPasswordForm.tsx

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Lock } from 'lucide-react';

import {
  ResetPasswordSchema,
  type ResetPasswordInput,
} from '../../../types';
import { useResetPassword } from '../auth.api';
import { toast } from 'sonner';
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

export function ResetPasswordForm() {
  const { t } = useTranslation(['auth', 'common']);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const resetPasswordMutation = useResetPassword();
  const token = searchParams.get('token') ?? '';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: {
      token,
      newPassword: '',
    },
  });

  const onSubmit = (data: ResetPasswordInput) => {
    resetPasswordMutation.mutate(data, {
      onSuccess: () => {
        toast.success(t('auth:password_changed'));
        setTimeout(() => navigate('/login'), 2000);
      },
      onError: (error) => {
        toast.error(t('common:error'), {
          description: extractErrorMessage(error),
        });
      },
    });
  };

  const isLoading = isSubmitting || resetPasswordMutation.isPending;

  if (!token) {
    return (
      <Card className="w-full">
        <CardHeader>
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
    <Card className="w-full">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">
          {t('auth:reset_password')}
        </CardTitle>
        <CardDescription>
          {t('auth:reset_password_description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Hidden token field */}
          <input type="hidden" {...register('token')} />

          {/* New Password Field */}
          <div className="space-y-2">
            <Label htmlFor="newPassword">{t('auth:new_password')}</Label>
            <Input
              id="newPassword"
              type="password"
              leftIcon={<Lock className="h-4 w-4" />}
              error={errors.newPassword?.message}
              disabled={isLoading}
              {...register('newPassword')}
            />
            <p className="text-xs text-muted-foreground">
              {t('auth:password_requirements')}
            </p>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            isLoading={isLoading}
            disabled={isLoading}
          >
            {t('auth:reset_password')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
