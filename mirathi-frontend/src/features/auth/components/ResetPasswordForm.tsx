import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Lock, KeyRound, XCircle, Clock } from 'lucide-react';

import { ResetPasswordRequestSchema, type ResetPasswordInput } from '../../../types';
import { useResetPassword, useValidateResetToken } from '../auth.api'; // Import validation hook
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator'; // Reusable component
import { PasswordRequirements } from '../../../components/auth/PasswordRequirements'; // Reusable component

// ============================================================================
// INVALID/VALIDATING TOKEN STATE
// ============================================================================
function TokenValidationState() {
  const { t } = useTranslation(['auth']);
  const navigate = useNavigate();
  return (
    <div className="w-full max-w-md text-center space-y-4">
       <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary/20 bg-primary/5 shadow-soft"><Clock className="h-8 w-8 text-primary animate-spin" /></div>
      <h1 className="text-2xl font-bold">{t('auth:validating_token', 'Validating Reset Link...')}</h1>
      <p className="text-text-subtle">{t('auth:please_wait', 'Please wait a moment.')}</p>
      <Button variant="outline" onClick={() => navigate('/login')}>{t('auth:back_to_login', 'Back to Login')}</Button>
    </div>
  );
}

function InvalidTokenState() {
  const { t } = useTranslation(['auth']);
  const navigate = useNavigate();
  return (
    <div className="w-full max-w-md text-center space-y-4">
       <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-danger/20 bg-danger/5 shadow-soft"><XCircle className="h-8 w-8 text-danger" /></div>
      <h1 className="text-2xl font-bold">{t('auth:invalid_reset_link', 'Invalid or Expired Link')}</h1>
      <p className="text-text-subtle">{t('auth:invalid_reset_link_description', 'This password reset link is no longer valid. Please request a new one.')}</p>
      <div className="flex gap-4">
        <Button onClick={() => navigate('/forgot-password')} className="flex-1">{t('auth:request_new_link', 'Request New Link')}</Button>
        <Button variant="outline" onClick={() => navigate('/login')} className="flex-1">{t('auth:back_to_login', 'Back to Login')}</Button>
      </div>
    </div>
  );
}


// ============================================================================
// MAIN RESET PASSWORD FORM
// ============================================================================
export function ResetPasswordForm() {
  const { t } = useTranslation(['auth', 'validation']);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const { mutate: validateToken, data: validationResult, isPending: isCheckingToken, isError: isTokenInvalid } = useValidateResetToken();
  const { mutate: resetPassword, isPending: isResetting } = useResetPassword();

  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);

  useEffect(() => {
    if (token) {
      validateToken({ token });
    }
  }, [token, validateToken]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(ResetPasswordRequestSchema),
    mode: 'onTouched',
    defaultValues: { token, password: '', passwordConfirmation: '' },
  });

  const watchedPassword = watch('password', '');

  const onSubmit = (formData: ResetPasswordInput) => {
    resetPassword(formData, {
      onSuccess: () => {
        // Success toast is handled by the hook. We just navigate after a delay.
        setTimeout(() => navigate('/login', { replace: true }), 2000);
      },
      onError: (error) => {
        // Error toast is handled by the hook.
        console.error("Reset password form error:", error);
      }
    });
  };

  if (isCheckingToken || !token) {
    return <TokenValidationState />;
  }

  if (isTokenInvalid || !validationResult?.valid) {
    return <InvalidTokenState />;
  }

  return (
    <div className="w-full max-w-md space-y-8">
      <div className="space-y-4 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary/20 bg-primary/5 shadow-soft"><KeyRound className="h-8 w-8 text-primary" /></div>
        <div className="space-y-2">
          <h1 className="font-display text-3xl font-bold tracking-tight text-text sm:text-4xl">{t('auth:set_new_password', 'Set a New Password')}</h1>
          <p className="text-base leading-relaxed text-text-subtle">{t('auth:reset_password_description', 'Your new password must be different from previous passwords.')}</p>
        </div>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <input type="hidden" {...register('token')} />
        <div className="space-y-2">
            <Label htmlFor="password">{t('auth:new_password', 'New Password')}</Label>
            <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <Input id="password" type="password" onFocus={() => setShowPasswordRequirements(true)} disabled={isResetting} {...register('password')} />
            </div>
            <PasswordStrengthIndicator password={watchedPassword} />
            <PasswordRequirements password={watchedPassword} show={showPasswordRequirements} />
            {errors.password && <p className="text-sm text-danger">{errors.password.message}</p>}
        </div>
        <div className="space-y-2">
            <Label htmlFor="passwordConfirmation">{t('auth:confirm_new_password', 'Confirm New Password')}</Label>
            <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <Input id="passwordConfirmation" type="password" disabled={isResetting} {...register('passwordConfirmation')} />
            </div>
            {errors.passwordConfirmation && <p className="text-sm text-danger">{errors.passwordConfirmation.message}</p>}
        </div>
        <Button type="submit" className="w-full" size="lg" isLoading={isResetting} disabled={isResetting}>
            {isResetting ? t('auth:resetting_password', 'Resetting...') : t('auth:set_new_password', 'Set New Password')}
        </Button>
      </form>
    </div>
  );
}