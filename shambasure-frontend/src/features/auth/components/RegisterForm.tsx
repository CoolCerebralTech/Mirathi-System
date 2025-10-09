// FILE: src/features/auth/components/RegisterForm.tsx

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, User } from 'lucide-react';

import { RegisterSchema, type RegisterInput } from '../../../types';
import { useRegister } from '../auth.api';
import { toast } from '../../../components/common/Toaster';
import { extractErrorMessage } from '../../../api/client';

import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/Select';

export function RegisterForm() {
  const { t } = useTranslation(['auth', 'common']);
  const navigate = useNavigate();
  const registerMutation = useRegister();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: 'LAND_OWNER',
    },
  });

  const onSubmit = async (data: RegisterInput) => {
    registerMutation.mutate(data, {
      onSuccess: () => {
        toast.success(t('auth:register_success'));
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

  const isLoading = isSubmitting || registerMutation.isPending;

  return (
    <Card className="w-full">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">{t('auth:create_account')}</CardTitle>
        <CardDescription>
          {t('auth:get_started')} with Shamba Sure
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name Fields */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">{t('auth:first_name')}</Label>
              <Input
                id="firstName"
                type="text"
                placeholder="John"
                leftIcon={<User className="h-4 w-4" />}
                error={errors.firstName?.message}
                disabled={isLoading}
                {...register('firstName')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">{t('auth:last_name')}</Label>
              <Input
                id="lastName"
                type="text"
                placeholder="Doe"
                leftIcon={<User className="h-4 w-4" />}
                error={errors.lastName?.message}
                disabled={isLoading}
                {...register('lastName')}
              />
            </div>
          </div>

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
            <Label htmlFor="password">{t('auth:password')}</Label>
            <Input
              id="password"
              type="password"
              leftIcon={<Lock className="h-4 w-4" />}
              error={errors.password?.message}
              disabled={isLoading}
              {...register('password')}
            />
            <p className="text-xs text-muted-foreground">
              Must be at least 8 characters with uppercase, lowercase, number, and special character
            </p>
          </div>

          {/* Role Selection */}
          <div className="space-y-2">
            <Label htmlFor="role">I am a</Label>
            <Select
              defaultValue="LAND_OWNER"
              onValueChange={(value) => setValue('role', value as any)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('common:select_option')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LAND_OWNER">{t('auth:role_land_owner')}</SelectItem>
                <SelectItem value="HEIR">{t('auth:role_heir')}</SelectItem>
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-sm text-destructive">{errors.role.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            isLoading={isLoading}
            disabled={isLoading}
          >
            {t('auth:create_account')}
          </Button>
        </form>

        {/* Sign In Link */}
        <div className="mt-6 text-center text-sm">
          <span className="text-muted-foreground">{t('auth:have_account')} </span>
          <Link
            to="/login"
            className="font-medium text-primary hover:underline"
          >
            {t('auth:sign_in')}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}