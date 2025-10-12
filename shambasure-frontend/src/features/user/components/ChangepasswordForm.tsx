// FILE: src/features/user/components/ChangePasswordForm.tsx)

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Lock } from 'lucide-react';
import { toast } from 'sonner';

import { ChangePasswordSchema, type ChangePasswordInput } from '../../../types';
import { useChangePassword } from '../user.api';
import { extractErrorMessage } from '../../../api/client';

import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card';

export function ChangePasswordForm() {
  const { t } = useTranslation(['auth', 'common']);
  const changePasswordMutation = useChangePassword();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(ChangePasswordSchema),
  });

  const onSubmit = (data: ChangePasswordInput) => {
    changePasswordMutation.mutate(data, {
      onSuccess: () => {
        toast.success(t('auth:password_changed_success'));
        reset();
      },
      onError: (error) => {
        toast.error(t('auth:password_changed_failed'), {
          description: extractErrorMessage(error),
        });
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('auth:change_password')}</CardTitle>
        <CardDescription>{t('auth:change_password_prompt')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="currentPassword">{t('auth:current_password')}</Label>
            <Input
              id="currentPassword"
              type="password"
              leftIcon={<Lock size={16} />}
              error={errors.currentPassword?.message}
              disabled={changePasswordMutation.isPending}
              {...register('currentPassword')}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="newPassword">{t('auth:new_password')}</Label>
            <Input
              id="newPassword"
              type="password"
              leftIcon={<Lock size={16} />}
              error={errors.newPassword?.message}
              disabled={changePasswordMutation.isPending}
              {...register('newPassword')}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => reset()}
              disabled={changePasswordMutation.isPending}
            >
              {t('common:cancel')}
            </Button>
            <Button type="submit" isLoading={changePasswordMutation.isPending}>
              {t('common:update_password')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}