// FILE: src/features/auth/components/RegisterForm.tsx

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';

import { RegisterRequestSchema, type RegisterInput } from '../../../types'; 
import type { UserRole } from '../../../types';
import { useRegister } from '../auth.api';
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
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterRequestSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: 'LAND_OWNER',
    },
  });

  const onSubmit = (data: RegisterInput) => {
    registerMutation.mutate(data, {
      onSuccess: () => {
        toast.success(t('auth:register_success'));
        navigate('/dashboard', { replace: true });
      },
      onError: (error) => {
        toast.error(t('auth:register_failed'), {
          description: extractErrorMessage(error),
        });
      },
    });
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{t('auth:create_account')}</CardTitle>
        <CardDescription>{t('auth:get_started_prompt')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="firstName">{t('auth:first_name')}</Label>
              <Input
                id="firstName"
                placeholder="John"
                leftIcon={<UserIcon size={16} />}
                error={errors.firstName?.message}
                disabled={registerMutation.isPending}
                {...register('firstName')}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="lastName">{t('auth:last_name')}</Label>
              <Input
                id="lastName"
                placeholder="Mwangi"
                leftIcon={<UserIcon size={16} />}
                error={errors.lastName?.message}
                disabled={registerMutation.isPending}
                {...register('lastName')}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="email">{t('auth:email')}</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              leftIcon={<Mail size={16} />}
              error={errors.email?.message}
              disabled={registerMutation.isPending}
              {...register('email')}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="password">{t('auth:password')}</Label>
            <Input
              id="password"
              type="password"
              leftIcon={<Lock size={16} />}
              error={errors.password?.message}
              disabled={registerMutation.isPending}
              {...register('password')}
            />
          </div>
          
          <div className="space-y-1">
            <Label htmlFor="role">{t('auth:i_am_a')}</Label>
            <Select
              defaultValue="LAND_OWNER"
              // BUG FIX: Provide the correct, strong type instead of 'as any'
              onValueChange={(value) => setValue('role', value as UserRole, { shouldValidate: true })}
              disabled={registerMutation.isPending}
            >
              <SelectTrigger id="role">
                <SelectValue placeholder={t('common:select_option')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LAND_OWNER">{t('auth:role_land_owner')}</SelectItem>
                <SelectItem value="HEIR">{t('auth:role_heir')}</SelectItem>
              </SelectContent>
            </Select>
            {errors.role && <p className="text-sm text-destructive">{errors.role.message}</p>}
          </div>

          <Button type="submit" className="w-full" isLoading={registerMutation.isPending}>
            {t('auth:create_account')}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm">
          {t('auth:have_account')}{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            {t('auth:sign_in_now')}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}