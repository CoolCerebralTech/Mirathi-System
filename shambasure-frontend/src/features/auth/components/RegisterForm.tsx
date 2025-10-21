// ============================================================================
// RegisterForm.tsx - User Registration Form Component
// ============================================================================
// Production-ready registration form with comprehensive validation,
// password strength indicator, role protection, and accessible UI.
// ============================================================================

import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, User as UserIcon, Shield, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';

import {
  RegisterRequestSchema,
  type RegisterFormInput,
  type RegisterInput,
  getRegisterableRoles,
  getRoleLabel,
  getRoleDescription,
  calculatePasswordStrength,
  type RegisterableRole,
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
          aria-valuenow={strength === 'weak' ? 25 : strength === 'medium' ? 50 : strength === 'strong' ? 75 : 100}
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
// ROLE DESCRIPTION COMPONENT
// ============================================================================

interface RoleDescriptionProps {
  role: RegisterableRole | undefined;
}

function RoleDescription({ role }: RoleDescriptionProps) {
  if (!role) return null;

  const description = getRoleDescription(role);

  return (
    <div className="mt-2 flex items-start gap-2 rounded-md bg-muted/50 p-3 text-xs">
      <Info size={14} className="mt-0.5 flex-shrink-0 text-muted-foreground" />
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

// ============================================================================
// MAIN REGISTRATION FORM
// ============================================================================

export function RegisterForm() {
  const { t } = useTranslation(['auth', 'validation', 'common']);
  const navigate = useNavigate();
  const { mutate: registerUser, isPending } = useRegister();

  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  const [passwordValue, setPasswordValue] = useState('');

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isValid },
  } = useForm<RegisterFormInput>({
    resolver: zodResolver(RegisterRequestSchema),
    mode: 'onChange', // Validate on change for better UX
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'LAND_OWNER', // Default role
    },
  });

  // Watch password field for strength indicator
  const watchedPassword = watch('password');
  const watchedRole = watch('role') as RegisterableRole | undefined;

  useEffect(() => {
    setPasswordValue(watchedPassword || '');
  }, [watchedPassword]);

  /**
   * Form submission handler
   * Validates data and sends to API
   */
  const onSubmit: SubmitHandler<RegisterFormInput> = (formData) => {
    try {
      // Parse and validate with schema defaults
      const payload: RegisterInput = RegisterRequestSchema.parse(formData);

      registerUser(
        { data: payload, rememberMe: true },
        {
          onSuccess: () => {
            toast.success(t('auth:register_success_title'), {
              description: t('auth:register_success_description'),
              duration: 4000,
            });
            navigate('/dashboard', { replace: true });
          },
          onError: (error) => {
            const errorMessage = extractErrorMessage(error);
            toast.error(t('auth:register_failed_title'), {
              description: errorMessage,
              duration: 5000,
            });
          },
        },
      );
    } catch (error) {
      console.error('[RegisterForm] Validation error:', error);
      toast.error(t('auth:register_failed_title'), {
        description: t('validation:invalid_form_data'),
      });
    }
  };

  // Get registerable roles (excludes ADMIN)
  const availableRoles = getRegisterableRoles();

  return (
    <Card className="w-full max-w-lg shadow-lg">
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold">
          {t('auth:create_account')}
        </CardTitle>
        <CardDescription className="text-base">
          {t('auth:get_started_prompt')}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {/* Name Fields - Side by Side */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* First Name */}
            <div className="space-y-2">
              <Label htmlFor="firstName" required>
                {t('auth:first_name')}
              </Label>
              <Input
                id="firstName"
                type="text"
                placeholder={t('auth:first_name_placeholder')}
                autoComplete="given-name"
                leftIcon={<UserIcon className="text-muted-foreground" size={16} />}
                disabled={isPending}
                aria-invalid={!!errors.firstName}
                aria-describedby={errors.firstName ? 'firstName-error' : undefined}
                {...register('firstName')}
              />
              {errors.firstName && (
                <p
                  id="firstName-error"
                  className="text-sm text-destructive flex items-center gap-1"
                  role="alert"
                >
                  <AlertCircle size={14} />
                  {errors.firstName.message}
                </p>
              )}
            </div>

            {/* Last Name */}
            <div className="space-y-2">
              <Label htmlFor="lastName" required>
                {t('auth:last_name')}
              </Label>
              <Input
                id="lastName"
                type="text"
                placeholder={t('auth:last_name_placeholder')}
                autoComplete="family-name"
                leftIcon={<UserIcon className="text-muted-foreground" size={16} />}
                disabled={isPending}
                aria-invalid={!!errors.lastName}
                aria-describedby={errors.lastName ? 'lastName-error' : undefined}
                {...register('lastName')}
              />
              {errors.lastName && (
                <p
                  id="lastName-error"
                  className="text-sm text-destructive flex items-center gap-1"
                  role="alert"
                >
                  <AlertCircle size={14} />
                  {errors.lastName.message}
                </p>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" required>
              {t('auth:email')}
            </Label>
            <Input
              id="email"
              type="email"
              placeholder={t('auth:email_placeholder')}
              autoComplete="email"
              leftIcon={<Mail className="text-muted-foreground" size={16} />}
              disabled={isPending}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : undefined}
              {...register('email')}
            />
            {errors.email && (
              <p
                id="email-error"
                className="text-sm text-destructive flex items-center gap-1"
                role="alert"
              >
                <AlertCircle size={14} />
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password with Strength Indicator */}
          <div className="space-y-2">
            <Label htmlFor="password" required>
              {t('auth:password')}
            </Label>
            <Input
              id="password"
              type="password"
              placeholder={t('auth:password_placeholder')}
              autoComplete="new-password"
              leftIcon={<Lock className="text-muted-foreground" size={16} />}
              disabled={isPending}
              aria-invalid={!!errors.password}
              aria-describedby={
                errors.password ? 'password-error' : 'password-requirements'
              }
              onFocus={() => setShowPasswordRequirements(true)}
              {...register('password')}
            />
            
            {/* Password Strength Indicator */}
            <PasswordStrengthIndicator password={passwordValue} />

            {/* Password Requirements Checklist */}
            <PasswordRequirements
              password={passwordValue}
              show={showPasswordRequirements}
            />

            {errors.password && (
              <p
                id="password-error"
                className="text-sm text-destructive flex items-center gap-1"
                role="alert"
              >
                <AlertCircle size={14} />
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" required>
              {t('auth:confirm_password')}
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder={t('auth:confirm_password_placeholder')}
              autoComplete="new-password"
              leftIcon={<Lock className="text-muted-foreground" size={16} />}
              disabled={isPending}
              aria-invalid={!!errors.confirmPassword}
              aria-describedby={
                errors.confirmPassword ? 'confirmPassword-error' : undefined
              }
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p
                id="confirmPassword-error"
                className="text-sm text-destructive flex items-center gap-1"
                role="alert"
              >
                <AlertCircle size={14} />
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* Role Selection (ADMIN excluded) */}
          <div className="space-y-2">
            <Label htmlFor="role" required>
              {t('auth:i_am_a')}
            </Label>
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={isPending}
                >
                  <SelectTrigger
                    id="role"
                    aria-invalid={!!errors.role}
                    aria-describedby={errors.role ? 'role-error' : 'role-description'}
                  >
                    <SelectValue placeholder={t('common:select_option')} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {getRoleLabel(role)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />

            {/* Role Description */}
            <RoleDescription role={watchedRole} />

            {errors.role && (
              <p
                id="role-error"
                className="text-sm text-destructive flex items-center gap-1"
                role="alert"
              >
                <AlertCircle size={14} />
                {errors.role.message}
              </p>
            )}
          </div>

          {/* Terms and Privacy Notice */}
          <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
            <p>
              {t('auth:terms_notice_prefix')}{' '}
              <Link
                to="/terms"
                className="font-medium text-primary hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('auth:terms_of_service')}
              </Link>{' '}
              {t('common:and')}{' '}
              <Link
                to="/privacy"
                className="font-medium text-primary hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('auth:privacy_policy')}
              </Link>
              .
            </p>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            isLoading={isPending}
            disabled={isPending || !isValid}
            size="lg"
          >
            {isPending ? t('auth:creating_account') : t('auth:create_account')}
          </Button>
        </form>

        {/* Login Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            {t('auth:have_account')}{' '}
            <Link
              to="/login"
              className="font-semibold text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded inline-flex items-center gap-1"
              tabIndex={isPending ? -1 : 0}
            >
              {t('auth:sign_in_now')}
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
