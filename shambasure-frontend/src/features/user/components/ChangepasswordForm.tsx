// ============================================================================
// ChangePasswordForm.tsx - Authenticated User Password Change Component
// ============================================================================
// Production-ready password change form with current password verification,
// strength indicators, visibility toggles, and optional logout on success.
// ============================================================================

import { useState, useEffect } from 'react';
import { useForm, type UseFormRegister } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import {
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Info,
  Shield,
  KeyRound,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  ChangePasswordSchema,
  type ChangePasswordInput,
  calculatePasswordStrength,
} from '../../../types';
import { useChangePassword } from '../user.api';
import { useLogout } from '../../auth/auth.api';
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
import { Alert, AlertDescription, AlertTitle } from '../../../components/ui/Alert';
import { Checkbox } from '../../../components/ui/Checkbox';

// ============================================================================
// PASSWORD STRENGTH INDICATOR
// ============================================================================

interface PasswordStrengthIndicatorProps {
  password: string;
}

function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const { t } = useTranslation(['auth']);
  const strength = calculatePasswordStrength(password);

  if (!password) return null;

  const strengthConfig = {
    weak: {
      label: t('auth:password_weak'),
      color: 'bg-red-500',
      width: 'w-1/4',
      textColor: 'text-red-600',
    },
    medium: {
      label: t('auth:password_medium'),
      color: 'bg-orange-500',
      width: 'w-2/4',
      textColor: 'text-orange-600',
    },
    strong: {
      label: t('auth:password_strong'),
      color: 'bg-yellow-500',
      width: 'w-3/4',
      textColor: 'text-yellow-600',
    },
    'very-strong': {
      label: t('auth:password_very_strong'),
      color: 'bg-green-500',
      width: 'w-full',
      textColor: 'text-green-600',
    },
  };

  const config = strengthConfig[strength as keyof typeof strengthConfig];

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{t('auth:password_strength')}</span>
        <span className={`font-medium ${config.textColor}`}>{config.label}</span>
      </div>
      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${config.color} ${config.width}`}
          role="progressbar"
          aria-valuenow={
            strength === 'weak' ? 25 : strength === 'medium' ? 50 : strength === 'strong' ? 75 : 100
          }
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Password strength: ${config.label}`}
        />
      </div>
    </div>
  );
}

// ============================================================================
// PASSWORD REQUIREMENTS CHECKLIST
// ============================================================================

interface PasswordRequirementsProps {
  password: string;
  show: boolean;
}

function PasswordRequirements({ password, show }: PasswordRequirementsProps) {
  const { t } = useTranslation(['auth']);

  if (!show) return null;

  const requirements = [
    {
      met: password.length >= 8,
      label: t('auth:password_req_length'),
    },
    {
      met: /[A-Z]/.test(password),
      label: t('auth:password_req_uppercase'),
    },
    {
      met: /[a-z]/.test(password),
      label: t('auth:password_req_lowercase'),
    },
    {
      met: /[0-9]/.test(password),
      label: t('auth:password_req_number'),
    },
    {
      met: /[^A-Za-z0-9]/.test(password),
      label: t('auth:password_req_special'),
    },
  ];

  return (
    <div className="mt-2 space-y-1.5 text-xs">
      <p className="text-muted-foreground font-medium flex items-center gap-1.5">
        <Info size={14} />
        {t('auth:password_requirements')}
      </p>
      <ul className="space-y-1">
        {requirements.map((req, index) => (
          <li
            key={index}
            className={`flex items-center gap-2 ${
              req.met ? 'text-green-600' : 'text-muted-foreground'
            }`}
          >
            {req.met ? (
              <CheckCircle2 size={14} className="flex-shrink-0" />
            ) : (
              <AlertCircle size={14} className="flex-shrink-0" />
            )}
            <span>{req.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ============================================================================
// PASSWORD INPUT WITH VISIBILITY TOGGLE
// ============================================================================

interface PasswordInputProps {
  id: string;
  label: string;
  placeholder?: string;
  autoComplete: string;
  disabled?: boolean;
  error?: boolean;
  errorId?: string;
  register: ReturnType<UseFormRegister<ChangePasswordInput>>;
  onFocus?: () => void;
  showStrength?: boolean;
  passwordValue?: string;
}

function PasswordInputWithToggle({
  id,
  label,
  placeholder,
  autoComplete,
  disabled,
  error,
  errorId,
  register,
  onFocus,
  showStrength,
  passwordValue,
}: PasswordInputProps) {
  const { t } = useTranslation(['auth']);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-2">
      <Label htmlFor={id} required>
        {label}
      </Label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          id={id}
          type={showPassword ? 'text' : 'password'}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          aria-invalid={error}
          aria-describedby={errorId}
          className="pl-10 pr-10"
          onFocus={onFocus}
          {...register}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          disabled={disabled}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label={showPassword ? t('auth:hide_password') : t('auth:show_password')}
          tabIndex={disabled ? -1 : 0}
        >
          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {showStrength && passwordValue && (
        <PasswordStrengthIndicator password={passwordValue} />
      )}
    </div>
  );
}

// ============================================================================
// MAIN CHANGE PASSWORD FORM
// ============================================================================

/**
 * Change password form for authenticated users.
 * 
 * FEATURES:
 * - Current password verification
 * - New password strength indicator
 * - Password requirements checklist
 * - Password visibility toggles
 * - Confirm password validation
 * - Optional logout after change
 * - Form state management
 * - Cancel/reset functionality
 * 
 * SECURITY:
 * - Requires current password verification
 * - Enforces strong password requirements
 * - New password must differ from current
 * - Optional: Force logout after change (invalidate sessions)
 * - Audit logging at API level
 * 
 * UX:
 * - Real-time validation
 * - Visual feedback (strength meter)
 * - Clear error messages
 * - Dirty state tracking
 * - Success notification
 */
export function ChangePasswordForm() {
  const { t } = useTranslation(['auth', 'validation', 'common']);
  const { mutate: changePassword, isPending } = useChangePassword();
  const { mutate: logout, isPending: isLoggingOut } = useLogout();

  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  const [passwordValue, setPasswordValue] = useState('');
  const [logoutAfterChange, setLogoutAfterChange] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty, isValid },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(ChangePasswordSchema),
    mode: 'onChange',
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
  });

  const watchedNewPassword = watch('newPassword');

  // Update password value for strength indicator
  useEffect(() => {
    setPasswordValue(watchedNewPassword || '');
  }, [watchedNewPassword]);

  /**
   * Form submission handler
   * Changes password and optionally logs out user
   */
  const onSubmit = (formData: ChangePasswordInput) => {
    changePassword(formData, {
      onSuccess: () => {
        toast.success(t('auth:password_changed_success_title'), {
          description: t('auth:password_changed_success_description'),
          duration: 4000,
        });

        reset();

        // Optionally logout user after password change
        if (logoutAfterChange) {
          setTimeout(() => {
            logout(undefined, {
              onSuccess: () => {
                toast.info(t('auth:logged_out_after_password_change'), {
                  description: t('auth:please_login_new_password'),
                  duration: 5000,
                });
              },
            });
          }, 1500);
        }
      },
      onError: (error) => {
        const errorMessage = extractErrorMessage(error);
        toast.error(t('auth:password_changed_failed_title'), {
          description: errorMessage,
          duration: 5000,
        });
      },
    });
  };

  /**
   * Cancel handler - resets form to initial state
   */
  const handleCancel = () => {
    reset();
    setShowPasswordRequirements(false);
  };

  const isSubmitting = isPending || isLoggingOut;

  return (
    <Card className="shadow-lg">
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <KeyRound className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xl">
              {t('auth:change_password')}
            </CardTitle>
            <CardDescription>
              {t('auth:change_password_prompt')}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <CardContent className="space-y-6">
          {/* Security Notice */}
          <Alert className="bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
            <Shield className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-sm font-semibold">
              {t('auth:security_best_practices')}
            </AlertTitle>
            <AlertDescription className="mt-1 text-xs">
              {t('auth:password_change_security_tip')}
            </AlertDescription>
          </Alert>

          {/* Current Password */}
          <PasswordInputWithToggle
            id="currentPassword"
            label={t('auth:current_password')}
            placeholder={t('auth:enter_current_password')}
            autoComplete="current-password"
            disabled={isSubmitting}
            error={!!errors.currentPassword}
            errorId={errors.currentPassword ? 'currentPassword-error' : undefined}
            register={register('currentPassword')}
          />

          {errors.currentPassword && (
            <p
              id="currentPassword-error"
              className="text-sm text-destructive flex items-center gap-1"
              role="alert"
            >
              <AlertCircle size={14} />
              {errors.currentPassword.message}
            </p>
          )}

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-muted" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                {t('auth:new_password_section')}
              </span>
            </div>
          </div>

          {/* New Password with Strength Indicator */}
          <PasswordInputWithToggle
            id="newPassword"
            label={t('auth:new_password')}
            placeholder={t('auth:enter_new_password')}
            autoComplete="new-password"
            disabled={isSubmitting}
            error={!!errors.newPassword}
            errorId={errors.newPassword ? 'newPassword-error' : undefined}
            register={register('newPassword')}
            onFocus={() => setShowPasswordRequirements(true)}
            showStrength
            passwordValue={passwordValue}
          />

          {/* Password Requirements Checklist */}
          <PasswordRequirements
            password={passwordValue}
            show={showPasswordRequirements}
          />

          {errors.newPassword && (
            <p
              id="newPassword-error"
              className="text-sm text-destructive flex items-center gap-1"
              role="alert"
            >
              <AlertCircle size={14} />
              {errors.newPassword.message}
            </p>
          )}

          {/* Confirm New Password */}
          <PasswordInputWithToggle
            id="confirmNewPassword"
            label={t('auth:confirm_new_password')}
            placeholder={t('auth:confirm_password_placeholder')}
            autoComplete="new-password"
            disabled={isSubmitting}
            error={!!errors.confirmNewPassword}
            errorId={errors.confirmNewPassword ? 'confirmNewPassword-error' : undefined}
            register={register('confirmNewPassword')}
          />

          {errors.confirmNewPassword && (
            <p
              id="confirmNewPassword-error"
              className="text-sm text-destructive flex items-center gap-1"
              role="alert"
            >
              <AlertCircle size={14} />
              {errors.confirmNewPassword.message}
            </p>
          )}

          {/* Logout After Change Option */}
          <div className="flex items-start space-x-3 rounded-lg border border-muted bg-muted/30 p-4">
            <Checkbox
              id="logoutAfterChange"
              checked={logoutAfterChange}
              onCheckedChange={(checked) => setLogoutAfterChange(checked as boolean)}
              disabled={isSubmitting}
            />
            <div className="space-y-1">
              <Label
                htmlFor="logoutAfterChange"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                {t('auth:logout_after_password_change')}
              </Label>
              <p className="text-xs text-muted-foreground">
                {t('auth:logout_after_password_change_description')}
              </p>
            </div>
          </div>

          {/* Additional Security Notice */}
          <Alert variant="warning" className="bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              {t('auth:password_change_sessions_notice')}
            </AlertDescription>
          </Alert>
        </CardContent>

        <CardFooter className="flex justify-between gap-3 bg-muted/50">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting || !isDirty}
            className="min-w-[100px]"
          >
            {t('common:cancel')}
          </Button>
          <Button
            type="submit"
            isLoading={isSubmitting}
            disabled={isSubmitting || !isDirty || !isValid}
            className="min-w-[120px]"
          >
            {isSubmitting
              ? t('auth:updating_password')
              : t('auth:update_password')}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
