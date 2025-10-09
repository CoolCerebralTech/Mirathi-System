// FILE: src/features/auth/components/ChangePasswordForm.tsx

import { useChangePassword } from '../../user/user.api';

export function ChangePasswordForm() {
  const { t } = useTranslation(['auth', 'common']);
  const changePasswordMutation = useChangePassword();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(ChangePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
    },
  });

  const onSubmit = async (data: ChangePasswordInput) => {
    changePasswordMutation.mutate(data, {
      onSuccess: () => {
        toast.success(t('auth:password_changed'));
        reset();
      },
      onError: (error) => {
        toast.error(
          t('common:error'),
          extractErrorMessage(error)
        );
      },
    });
  };

  const isLoading = isSubmitting || changePasswordMutation.isPending;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t('auth:change_password')}</CardTitle>
        <CardDescription>
          Update your password to keep your account secure
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Current Password */}
          <div className="space-y-2">
            <Label htmlFor="currentPassword">{t('auth:current_password')}</Label>
            <Input
              id="currentPassword"
              type="password"
              leftIcon={<Lock className="h-4 w-4" />}
              error={errors.currentPassword?.message}
              disabled={isLoading}
              {...register('currentPassword')}
            />
          </div>

          {/* New Password */}
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
              Must be at least 8 characters with uppercase, lowercase, number, and special character
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => reset()}
              disabled={isLoading}
            >
              {t('common:cancel')}
            </Button>
            <Button
              type="submit"
              isLoading={isLoading}
              disabled={isLoading}
            >
              {t('common:update')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}