import { useState } from 'react';
import { useForm, type UseFormRegister } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Lock, Eye, EyeOff, AlertCircle, Shield, KeyRound } from 'lucide-react';

import { ChangePasswordRequestSchema, type ChangePasswordInput } from '../../../types';
import { useChangePassword } from '../../auth/auth.api';
import { useLogout } from '../../auth/auth.api';

import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../../../components/ui/Card';
import { Alert, AlertDescription, AlertTitle } from '../../../components/ui/Alert';
import { Checkbox } from '../../../components/ui/Checkbox';
import { PasswordStrengthIndicator } from '../../../components/auth/PasswordStrengthIndicator'; // Reusable component
import { PasswordRequirements } from '../../../components/auth/PasswordRequirements'; // Reusable component

// ============================================================================
// PASSWORD INPUT SUB-COMPONENT
// ============================================================================
interface PasswordInputWithToggleProps {
  id: keyof ChangePasswordInput;
  label: string;
  autoComplete: string;
  disabled?: boolean;
  register: UseFormRegister<ChangePasswordInput>;
  error?: string;
  onFocus?: () => void;
}

function PasswordInputWithToggle({ id, label, autoComplete, disabled, register, error, onFocus }: PasswordInputWithToggleProps) {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <Input
          id={id}
          type={showPassword ? 'text' : 'password'}
          autoComplete={autoComplete}
          disabled={disabled}
          onFocus={onFocus}
          className={`pr-10 ${error ? 'border-danger' : ''}`}
          {...register(id)}
        />
        <button type="button" onClick={() => setShowPassword(!showPassword)} disabled={disabled} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text">
          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {error && <p className="text-sm text-danger flex items-center gap-1.5"><AlertCircle size={14} />{error}</p>}
    </div>
  );
}

// ============================================================================
// MAIN CHANGE PASSWORD FORM
// ============================================================================
export function ChangePasswordForm() {
  const { t } = useTranslation(['auth', 'validation', 'common']);
  const { mutate: changePassword, isPending: isChangingPassword } = useChangePassword();
  const { mutate: logout } = useLogout();

  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(ChangePasswordRequestSchema),
    mode: 'onTouched',
    defaultValues: {
      currentPassword: '',
      password: '',
      passwordConfirmation: '',
      terminateOtherSessions: true, // Default to true for better security
    },
  });

  const watchedPassword = watch('password', '');
  const terminateSessions = watch('terminateOtherSessions');

  const onSubmit = (formData: ChangePasswordInput) => {
    changePassword(formData, {
      onSuccess: () => {
        // Success toast is handled by the hook. We just reset the form.
        reset();
        setShowPasswordRequirements(false);

        // If the user chose to log out, trigger the logout mutation.
        if (formData.terminateOtherSessions) {
          logout(undefined); // useLogout hook will show its own toast
        }
      },
      onError: (error) => {
        // Error toast is handled by the hook.
        console.error("Change password form error:", error);
      },
    });
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10"><KeyRound className="h-6 w-6 text-primary" /></div>
          <div>
            <CardTitle className="text-xl font-bold">{t('auth:change_password', 'Change Password')}</CardTitle>
            <CardDescription>{t('auth:change_password_prompt', 'Update your password for enhanced security.')}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <CardContent className="space-y-6">
          <Alert variant="info">
            <Shield className="h-4 w-4" />
            <AlertTitle>{t('auth:security_best_practices', 'Security Best Practices')}</AlertTitle>
            <AlertDescription>{t('auth:password_change_security_tip', 'Use a long, unique password that you don\'t use for any other service.')}</AlertDescription>
          </Alert>

          <PasswordInputWithToggle
            id="currentPassword"
            label={t('auth:current_password', 'Current Password')}
            autoComplete="current-password"
            disabled={isChangingPassword}
            register={register}
            error={errors.currentPassword?.message}
          />

          <div className="border-t border-neutral-200" />

          <PasswordInputWithToggle
            id="password"
            label={t('auth:new_password', 'New Password')}
            autoComplete="new-password"
            disabled={isChangingPassword}
            register={register}
            error={errors.password?.message}
            onFocus={() => setShowPasswordRequirements(true)}
          />

          <PasswordStrengthIndicator password={watchedPassword} />
          <PasswordRequirements password={watchedPassword} show={showPasswordRequirements} />
          {errors.root?.message && <p className="text-sm text-danger">{errors.root.message}</p>}


          <PasswordInputWithToggle
            id="passwordConfirmation"
            label={t('auth:confirm_new_password', 'Confirm New Password')}
            autoComplete="new-password"
            disabled={isChangingPassword}
            register={register}
            error={errors.passwordConfirmation?.message}
          />
          
          <div className="flex items-start space-x-3 rounded-lg border border-neutral-200 p-4">
            <Checkbox id="terminateOtherSessions" disabled={isChangingPassword} checked={terminateSessions} onCheckedChange={(checked) => register('terminateOtherSessions').onChange({ target: { value: checked } })} />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor="terminateOtherSessions" className="cursor-pointer">{t('auth:logout_after_password_change', 'Sign out of all other devices')}</Label>
              <p className="text-xs text-text-muted">{t('auth:logout_after_password_change_description', 'For your security, we recommend this option.')}</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-3 bg-neutral-50 p-4">
          <Button type="button" variant="outline" onClick={() => reset()} disabled={!isDirty || isChangingPassword}>
            {t('common:cancel', 'Cancel')}
          </Button>
          <Button type="submit" isLoading={isChangingPassword} disabled={isChangingPassword || !isDirty}>
            {t('auth:update_password', 'Update Password')}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}