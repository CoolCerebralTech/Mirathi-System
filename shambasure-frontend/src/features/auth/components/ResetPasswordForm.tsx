// ============================================================================
// ResetPasswordForm.tsx - Password Reset Completion Form Component
// ============================================================================
// Production-ready password reset form with token validation, password strength
// indicator, comprehensive error handling, and success redirection.
// ============================================================================

import { useEffect, useState } from 'react';
import { useForm, type UseFormRegister } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Lock,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  XCircle,
  Info,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  ResetPasswordSchema,
  type ResetPasswordInput,
  calculatePasswordStrength,
} from '../../../types';
import { useResetPassword } from '../auth.api';
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
import { Alert, AlertDescription, AlertTitle } from '../../../components/ui/Alert';

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
  disabled?: boolean;
  error?: boolean;
  errorId?: string;
  register: ReturnType<UseFormRegister<ResetPasswordInput>>;
  onFocus?: () => void;
  showStrength?: boolean;
  passwordValue?: string;
}

function PasswordInputWithToggle({
  id,
  label,
  placeholder,
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
          autoComplete="new-password"
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
// INVALID TOKEN STATE
// ============================================================================

function InvalidTokenState() {
  const { t } = useTranslation(['auth', 'common']);
  const navigate = useNavigate();

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="space-y-3 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
          <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
        </div>
        <CardTitle className="text-2xl font-bold">
          {t('auth:invalid_reset_link')}
        </CardTitle>
        <CardDescription className="text-base">
          {t('auth:invalid_reset_link_description')}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Possible Reasons */}
        <Alert variant="warning" className="bg-yellow-50 dark:bg-yellow-900/10">
          <Clock className="h-4 w-4" />
          <AlertTitle className="text-sm font-semibold">
            {t('auth:possible_reasons')}
          </AlertTitle>
          <AlertDescription className="mt-2">
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>{t('auth:link_expired')}</li>
              <li>{t('auth:link_already_used')}</li>
              <li>{t('auth:link_invalid')}</li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* Action Buttons */}
        <div className="space-y-2">
          <Button
            onClick={() => navigate('/forgot-password')}
            className="w-full"
            size="lg"
          >
            {t('auth:request_new_reset_link')}
          </Button>
          <Button variant="outline" asChild className="w-full">
            <Link to="/login">{t('auth:back_to_login')}</Link>
          </Button>
        </div>

        {/* Help Text */}
        <div className="rounded-md bg-muted/50 p-3 text-center">
          <p className="text-xs text-muted-foreground">
            {t('auth:need_help')}{' '}
            <Link
              to="/contact-support"
              className="font-medium text-primary hover:underline"
            >
              {t('auth:contact_support')}
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN RESET PASSWORD FORM
// ============================================================================

/**
 * Reset password form component.
 * 
 * FEATURES:
 * - Token validation from URL query params
 * - Password strength indicator
 * - Password requirements checklist
 * - Password visibility toggle
 * - Confirm password validation
 * - Loading states
 * - Success redirect to login
 * - Invalid token handling
 * 
 * SECURITY:
 * - Token expires in 1 hour
 * - Single-use tokens
 * - Strong password requirements
 * - Password confirmation
 * - Secure redirect after success
 * 
 * UX:
 * - Visual feedback (strength meter)
 * - Clear error messages
 * - Countdown before redirect
 * - Help text and support links
 */
export function ResetPasswordForm() {
  const { t } = useTranslation(['auth', 'validation', 'common']);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { mutate: resetPassword, isPending } = useResetPassword({
    onSuccess: () => {
      toast.success(t('auth:password_reset_success_title'), {
        description: t('auth:password_reset_success_description'),
        duration: 4000,
      });
      
      // Redirect after 2 seconds to allow user to read success message
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2000);
    },
  });

  const token = searchParams.get('token') ?? '';
  
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  const [passwordValue, setPasswordValue] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(ResetPasswordSchema),
    mode: 'onChange',
    defaultValues: {
      token,
      newPassword: '',
      confirmNewPassword: '',
    },
  });

  const watchedPassword = watch('newPassword');

  // Update password value for strength indicator
  useEffect(() => {
    setPasswordValue(watchedPassword || '');
  }, [watchedPassword]);

  // Ensure the token from URL is in form state
  useEffect(() => {
    if (token) {
      setValue('token', token);
    }
  }, [token, setValue]);

  /**
   * Form submission handler
   * Resets password with token
   */
  const onSubmit = (formData: ResetPasswordInput) => {
    resetPassword(formData, {
      onError: (error) => {
        const errorMessage = extractErrorMessage(error);
        toast.error(t('auth:password_reset_failed_title'), {
          description: errorMessage,
          duration: 5000,
        });
      },
    });
  };

  // Show invalid token state if no token in URL
  if (!token) {
    return <InvalidTokenState />;
  }

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <KeyRound className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold">
          {t('auth:reset_password')}
        </CardTitle>
        <CardDescription className="text-base">
          {t('auth:reset_password_description')}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {/* Hidden Token Field */}
          <input type="hidden" {...register('token')} />

          {/* Security Notice */}
          <Alert className="bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-xs">
              {t('auth:reset_password_security_tip')}
            </AlertDescription>
          </Alert>

          {/* New Password */}
          <PasswordInputWithToggle
            id="newPassword"
            label={t('auth:new_password')}
            placeholder={t('auth:password_placeholder')}
            disabled={isPending}
            error={!!errors.newPassword}
            errorId={errors.newPassword ? 'newPassword-error' : undefined}
            register={register('newPassword')}
            onFocus={() => setShowPasswordRequirements(true)}
            showStrength
            passwordValue={passwordValue}
          />

          {/* Password Requirements */}
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
            disabled={isPending}
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

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            size="lg"
            isLoading={isPending}
            disabled={isPending || !isValid}
          >
            {isPending ? t('auth:resetting_password') : t('auth:set_new_password')}
          </Button>
        </form>

        {/* Help Text */}
        <div className="mt-6 rounded-md bg-muted/50 p-3 text-center">
          <p className="text-xs text-muted-foreground">
            {t('auth:remember_password')}{' '}
            <Link
              to="/login"
              className="font-medium text-primary hover:underline"
              tabIndex={isPending ? -1 : 0}
            >
              {t('auth:back_to_login')}
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
