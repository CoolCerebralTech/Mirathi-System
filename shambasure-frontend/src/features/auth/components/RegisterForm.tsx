// FILE: src/features/auth/components/RegisterForm.tsx

import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';

import {
  RegisterRequestSchema,
  type RegisterFormInput, // 👈 use input type here
  type RegisterInput,     // 👈 parsed type for API
} from '../../../types';
import { useRegister } from '../auth.api';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/Select';

export function RegisterForm() {
  const { t } = useTranslation(['auth', 'validation', 'common']);
  const navigate = useNavigate();
  const { mutate: registerUser, isPending } = useRegister();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RegisterFormInput>({
    resolver: zodResolver(RegisterRequestSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      // no need to set role, schema default handles LAND_OWNER
    },
  });

  const onSubmit: SubmitHandler<RegisterFormInput> = (formData) => {
    // Parse to apply defaults and enforce required fields
    const payload: RegisterInput = RegisterRequestSchema.parse(formData);

    registerUser(
      { data: payload },
      {
        onSuccess: () => {
          toast.success(t('auth:register_success_title'));
          navigate('/dashboard', { replace: true });
        },
        onError: (error) => {
          toast.error(t('auth:register_failed_title'), {
            description: extractErrorMessage(error),
          });
        },
      },
    );
  };

  return (
    <Card className="w-full max-w-lg shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{t('auth:create_account')}</CardTitle>
        <CardDescription>{t('auth:get_started_prompt')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* First/Last name */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">{t('auth:first_name')}</Label>
              <Input
                id="firstName"
                autoComplete="given-name"
                leftIcon={<UserIcon className="text-muted-foreground" size={16} />}
                disabled={isPending}
                aria-invalid={!!errors.firstName}
                aria-describedby="firstName-error"
                {...register('firstName')}
              />
              {errors.firstName && (
                <p id="firstName-error" className="text-sm text-destructive">
                  {errors.firstName.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">{t('auth:last_name')}</Label>
              <Input
                id="lastName"
                autoComplete="family-name"
                leftIcon={<UserIcon className="text-muted-foreground" size={16} />}
                disabled={isPending}
                aria-invalid={!!errors.lastName}
                aria-describedby="lastName-error"
                {...register('lastName')}
              />
              {errors.lastName && (
                <p id="lastName-error" className="text-sm text-destructive">
                  {errors.lastName.message}
                </p>
              )}
            </div>
          </div>

          {/* Email */}
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

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">{t('auth:password')}</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
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

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t('auth:confirm_password')}</Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              leftIcon={<Lock className="text-muted-foreground" size={16} />}
              disabled={isPending}
              aria-invalid={!!errors.confirmPassword}
              aria-describedby="confirmPassword-error"
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p id="confirmPassword-error" className="text-sm text-destructive">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label htmlFor="role">{t('auth:i_am_a')}</Label>
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={isPending}
                >
                  <SelectTrigger id="role" aria-invalid={!!errors.role}>
                    <SelectValue placeholder={t('common:select_option')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LAND_OWNER">{t('auth:role_land_owner')}</SelectItem>
                    <SelectItem value="HEIR">{t('auth:role_heir')}</SelectItem>
                    <SelectItem value="ADMIN">{t('auth:role_admin')}</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.role && (
              <p className="text-sm text-destructive">{errors.role.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" isLoading={isPending}>
            {t('auth:create_account')}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t('auth:have_account')}{' '}
          <Link
            to="/login"
            className="font-semibold text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
          >
            {t('auth:sign_in_now')}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
