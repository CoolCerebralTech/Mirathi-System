// FILE: src/features/user/components/ChangePasswordForm.tsx

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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '../../../components/ui/Card';

/**
 * A form for an authenticated user to change their password.
 */
export function ChangePasswordForm() {
  const { t } = useTranslation(['auth', 'validation', 'common']);
  const { mutate: changePassword, isPending } = useChangePassword();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(ChangePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
  });

  const onSubmit = (formData: ChangePasswordInput) => {
    changePassword(formData, {
      onSuccess: () => {
        toast.success(t('auth:password_changed_success_title'));
        reset();
      },
      onError: (error) => {
        toast.error(t('auth:password_changed_failed_title'), {
          description: extractErrorMessage(error),
        });
      },
    });
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>{t('auth:change_password')}</CardTitle>
        <CardDescription>{t('auth:change_password_prompt')}</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">{t('auth:current_password')}</Label>
            <Input
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              leftIcon={<Lock className="text-muted-foreground" size={16} />}
              disabled={isPending}
              aria-invalid={!!errors.currentPassword}
              aria-describedby="currentPassword-error"
              {...register('currentPassword')}
            />
            {errors.currentPassword && (
              <p id="currentPassword-error" className="text-sm text-destructive">
                {errors.currentPassword.message}
              </p>
            )}
          </div>

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
              <p
                id="confirmNewPassword-error"
                className="text-sm text-destructive"
              >
                {errors.confirmNewPassword.message}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => reset()}
            disabled={isPending || !isDirty}
          >
            {t('common:cancel')}
          </Button>
          <Button type="submit" isLoading={isPending} disabled={!isDirty}>
            {t('common:update_password')}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}