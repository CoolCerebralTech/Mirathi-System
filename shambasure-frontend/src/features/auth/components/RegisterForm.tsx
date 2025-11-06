// ============================================================================
// RegisterForm.tsx - Updated Registration Form
// ============================================================================

import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Mail, 
  Lock, 
  User as UserIcon, 
  Shield, 
  CheckCircle2, 
  AlertCircle, 
  Info,
  UserPlus,
  Check
} from 'lucide-react';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';

import {
  RegisterRequestSchema,
  type RegisterFormInput,
  type RegisterInput,
  calculatePasswordStrength,
} from '../../../types';
import { useRegister } from '../auth.api';
import { extractErrorMessage } from '../../../api/client';

import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import { Checkbox } from '../../../components/ui/Checkbox';

// ============================================================================
// DEVICE ID GENERATION
// ============================================================================

const generateDeviceId = (): string => {
  const existingDeviceId = localStorage.getItem('shamba_device_id');
  if (existingDeviceId) {
    return existingDeviceId;
  }

  const newDeviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  localStorage.setItem('shamba_device_id', newDeviceId);
  return newDeviceId;
};

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
      label: t('auth:password_weak', 'Weak'),
      color: 'bg-danger',
      width: 'w-1/4',
      textColor: 'text-danger',
    },
    medium: {
      label: t('auth:password_medium', 'Fair'),
      color: 'bg-warning',
      width: 'w-2/4',
      textColor: 'text-warning',
    },
    strong: {
      label: t('auth:password_strong', 'Good'),
      color: 'bg-secondary',
      width: 'w-3/4',
      textColor: 'text-secondary',
    },
    'very-strong': {
      label: t('auth:password_very_strong', 'Excellent'),
      color: 'bg-secondary',
      width: 'w-full',
      textColor: 'text-secondary',
    },
  };

  const config = strengthConfig[strength as keyof typeof strengthConfig];

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-text-muted">{t('auth:password_strength', 'Password Strength')}</span>
        <span className={`font-medium ${config.textColor}`}>{config.label}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-200">
        <div
          className={`h-full transition-all duration-500 ${config.color} ${config.width}`}
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
      label: t('auth:password_req_length', 'At least 8 characters'),
    },
    {
      met: /[A-Z]/.test(password),
      label: t('auth:password_req_uppercase', 'One uppercase letter'),
    },
    {
      met: /[a-z]/.test(password),
      label: t('auth:password_req_lowercase', 'One lowercase letter'),
    },
    {
      met: /[0-9]/.test(password),
      label: t('auth:password_req_number', 'One number'),
    },
    {
      met: /[^A-Za-z0-9]/.test(password),
      label: t('auth:password_req_special', 'One special character'),
    },
  ];

  return (
    <div className="mt-3 space-y-2 rounded-elegant border border-neutral-200 bg-background-subtle p-3 text-xs">
      <p className="flex items-center gap-1.5 font-semibold text-text">
        <Info size={14} />
        {t('auth:password_requirements', 'Password Requirements')}
      </p>
      <ul className="space-y-1.5">
        {requirements.map((req, index) => (
          <li
            key={index}
            className={`flex items-center gap-2 transition-colors duration-300 ${
              req.met ? 'text-secondary' : 'text-text-muted'
            }`}
          >
            {req.met ? (
              <CheckCircle2 size={14} className="flex-shrink-0" />
            ) : (
              <div className="h-3.5 w-3.5 flex-shrink-0 rounded-full border-2 border-neutral-300" />
            )}
            <span>{req.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ============================================================================
// MAIN REGISTRATION FORM - UPDATED WITH NEW FIELDS
// ============================================================================

export function RegisterForm() {
  const { t } = useTranslation(['auth', 'validation', 'common']);
  const navigate = useNavigate();
  const { mutate: registerUser, isPending } = useRegister();

  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  const [passwordValue, setPasswordValue] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<RegisterFormInput>({
    resolver: zodResolver(RegisterRequestSchema),
    mode: 'onChange',
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      passwordConfirmation: '',
      acceptedTerms: false,
      marketingOptIn: false,
      deviceId: generateDeviceId(),
    },
  });

  const watchedPassword = watch('password');

  useEffect(() => {
    setPasswordValue(watchedPassword || '');
  }, [watchedPassword]);

  const onSubmit: SubmitHandler<RegisterFormInput> = (formData) => {
    try {
      // Ensure deviceId is always set
      const registrationData: RegisterInput = {
        ...formData,
        deviceId: formData.deviceId || generateDeviceId(),
      };

      registerUser(
        { data: registrationData, rememberMe: true },
        {
          onSuccess: () => {
            toast.success(t('auth:register_success_title', 'Account Created!'), {
              description: t('auth:register_success_description', 'Welcome to Shamba Sure'),
              duration: 4000,
            });
            navigate('/dashboard', { replace: true });
          },
          onError: (error) => {
            const errorMessage = extractErrorMessage(error);
            toast.error(t('auth:register_failed_title', 'Registration Failed'), {
              description: errorMessage,
              duration: 5000,
            });
          },
        },
      );
    } catch (error) {
      console.error('[RegisterForm] Validation error:', error);
      toast.error(t('auth:register_failed_title', 'Registration Failed'), {
        description: t('validation:invalid_form_data', 'Please check your information'),
      });
    }
  };

  return (
    <div className="w-full space-y-8">
      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      {/* HEADER - Elegant & Welcoming */}
      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      <div className="space-y-4 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary/20 bg-primary/5 shadow-soft">
          <UserPlus className="h-8 w-8 text-primary" />
        </div>
        
        <div className="space-y-2">
          <h1 className="font-display text-3xl font-bold tracking-tight text-text sm:text-4xl">
            {t('auth:create_account', 'Create Your Account')}
          </h1>
          <p className="text-base leading-relaxed text-text-subtle">
            {t('auth:get_started_prompt', 'Join thousands protecting their family\'s land legacy')}
          </p>
        </div>

        {/* Security Badge */}
        <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-secondary/20 bg-secondary/5 px-4 py-1.5 text-xs font-medium text-secondary">
          <Shield className="h-3.5 w-3.5" />
          <span>{t('auth:secure_registration', 'Secure Registration')}</span>
        </div>
      </div>

      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      {/* FORM - Clean & Refined */}
      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        
        {/* Name Fields - Side by Side */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* First Name */}
          <div className="space-y-2">
            <Label htmlFor="firstName" className="font-serif text-sm font-semibold text-text">
              {t('auth:first_name', 'First Name')}
              <span className="ml-1 text-danger">*</span>
            </Label>
            <div className="relative">
              <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <Input
                id="firstName"
                type="text"
                placeholder={t('auth:first_name_placeholder', 'John')}
                autoComplete="given-name"
                disabled={isPending}
                aria-invalid={!!errors.firstName}
                aria-describedby={errors.firstName ? 'firstName-error' : undefined}
                className={`
                  pl-10
                  border-neutral-300 bg-background 
                  transition-all duration-300 
                  focus:border-primary focus:ring-2 focus:ring-primary/20
                  ${errors.firstName ? 'border-danger focus:border-danger focus:ring-danger/20' : ''}
                `}
                {...register('firstName')}
              />
            </div>
            {errors.firstName && (
              <p id="firstName-error" className="flex items-center gap-1.5 text-sm text-danger" role="alert">
                <AlertCircle size={14} className="flex-shrink-0" />
                <span>{errors.firstName.message}</span>
              </p>
            )}
          </div>

          {/* Last Name */}
          <div className="space-y-2">
            <Label htmlFor="lastName" className="font-serif text-sm font-semibold text-text">
              {t('auth:last_name', 'Last Name')}
              <span className="ml-1 text-danger">*</span>
            </Label>
            <div className="relative">
              <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <Input
                id="lastName"
                type="text"
                placeholder={t('auth:last_name_placeholder', 'Doe')}
                autoComplete="family-name"
                disabled={isPending}
                aria-invalid={!!errors.lastName}
                aria-describedby={errors.lastName ? 'lastName-error' : undefined}
                className={`
                  pl-10
                  border-neutral-300 bg-background 
                  transition-all duration-300 
                  focus:border-primary focus:ring-2 focus:ring-primary/20
                  ${errors.lastName ? 'border-danger focus:border-danger focus:ring-danger/20' : ''}
                `}
                {...register('lastName')}
              />
            </div>
            {errors.lastName && (
              <p id="lastName-error" className="flex items-center gap-1.5 text-sm text-danger" role="alert">
                <AlertCircle size={14} className="flex-shrink-0" />
                <span>{errors.lastName.message}</span>
              </p>
            )}
          </div>
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email" className="font-serif text-sm font-semibold text-text">
            {t('auth:email', 'Email Address')}
            <span className="ml-1 text-danger">*</span>
          </Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <Input
              id="email"
              type="email"
              placeholder={t('auth:email_placeholder', 'you@example.com')}
              autoComplete="email"
              disabled={isPending}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : undefined}
              className={`
                pl-10
                border-neutral-300 bg-background 
                transition-all duration-300 
                focus:border-primary focus:ring-2 focus:ring-primary/20
                ${errors.email ? 'border-danger focus:border-danger focus:ring-danger/20' : ''}
              `}
              {...register('email')}
            />
          </div>
          {errors.email && (
            <p id="email-error" className="flex items-center gap-1.5 text-sm text-danger" role="alert">
              <AlertCircle size={14} className="flex-shrink-0" />
              <span>{errors.email.message}</span>
            </p>
          )}
        </div>

        {/* Password with Strength Indicator */}
        <div className="space-y-2">
          <Label htmlFor="password" className="font-serif text-sm font-semibold text-text">
            {t('auth:password', 'Password')}
            <span className="ml-1 text-danger">*</span>
          </Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <Input
              id="password"
              type="password"
              placeholder={t('auth:password_placeholder', 'Create a strong password')}
              autoComplete="new-password"
              disabled={isPending}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'password-error' : 'password-requirements'}
              onFocus={() => setShowPasswordRequirements(true)}
              className={`
                pl-10
                border-neutral-300 bg-background 
                transition-all duration-300 
                focus:border-primary focus:ring-2 focus:ring-primary/20
                ${errors.password ? 'border-danger focus:border-danger focus:ring-danger/20' : ''}
              `}
              {...register('password')}
            />
          </div>
          
          <PasswordStrengthIndicator password={passwordValue} />
          <PasswordRequirements password={passwordValue} show={showPasswordRequirements} />

          {errors.password && (
            <p id="password-error" className="flex items-center gap-1.5 text-sm text-danger" role="alert">
              <AlertCircle size={14} className="flex-shrink-0" />
              <span>{errors.password.message}</span>
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-2">
          <Label htmlFor="passwordConfirmation" className="font-serif text-sm font-semibold text-text">
            {t('auth:confirm_password', 'Confirm Password')}
            <span className="ml-1 text-danger">*</span>
          </Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <Input
              id="passwordConfirmation"
              type="password"
              placeholder={t('auth:confirm_password_placeholder', 'Re-enter your password')}
              autoComplete="new-password"
              disabled={isPending}
              aria-invalid={!!errors.passwordConfirmation}
              aria-describedby={errors.passwordConfirmation ? 'passwordConfirmation-error' : undefined}
              className={`
                pl-10
                border-neutral-300 bg-background 
                transition-all duration-300 
                focus:border-primary focus:ring-2 focus:ring-primary/20
                ${errors.passwordConfirmation ? 'border-danger focus:border-danger focus:ring-danger/20' : ''}
              `}
              {...register('passwordConfirmation')}
            />
          </div>
          {errors.passwordConfirmation && (
            <p id="passwordConfirmation-error" className="flex items-center gap-1.5 text-sm text-danger" role="alert">
              <AlertCircle size={14} className="flex-shrink-0" />
              <span>{errors.passwordConfirmation.message}</span>
            </p>
          )}
        </div>

        {/* Terms and Conditions */}
        <div className="space-y-3">
          <div className="flex items-start space-x-2">
            <Checkbox
              id="acceptedTerms"
              checked={acceptedTerms}
              onCheckedChange={(checked) => {
                setAcceptedTerms(checked as boolean);
                // Update form value
                register('acceptedTerms').onChange({
                  target: { value: checked, name: 'acceptedTerms' }
                });
              }}
              disabled={isPending}
              className="mt-0.5 border-neutral-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              aria-invalid={!!errors.acceptedTerms}
              aria-describedby={errors.acceptedTerms ? 'acceptedTerms-error' : undefined}
            />
            <Label
              htmlFor="acceptedTerms"
              className="cursor-pointer select-none text-sm font-normal leading-relaxed text-text peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {t('auth:accept_terms_prefix', 'I agree to the')}{' '}
              <Link
                to="/terms"
                className="font-medium text-primary transition-colors hover:text-primary-hover hover:underline"
                target="_blank"
                rel="noopener noreferrer"
                tabIndex={isPending ? -1 : 0}
              >
                {t('auth:terms_of_service', 'Terms of Service')}
              </Link>{' '}
              {t('common:and', 'and')}{' '}
              <Link
                to="/privacy"
                className="font-medium text-primary transition-colors hover:text-primary-hover hover:underline"
                target="_blank"
                rel="noopener noreferrer"
                tabIndex={isPending ? -1 : 0}
              >
                {t('auth:privacy_policy', 'Privacy Policy')}
              </Link>
              <span className="ml-1 text-danger">*</span>
            </Label>
          </div>
          {errors.acceptedTerms && (
            <p id="acceptedTerms-error" className="flex items-center gap-1.5 text-sm text-danger" role="alert">
              <AlertCircle size={14} className="flex-shrink-0" />
              <span>{errors.acceptedTerms.message}</span>
            </p>
          )}
        </div>

        {/* Marketing Preferences */}
        <div className="flex items-start space-x-2">
          <Checkbox
            id="marketingOptIn"
            checked={marketingOptIn}
            onCheckedChange={(checked) => {
              setMarketingOptIn(checked as boolean);
              // Update form value
              register('marketingOptIn').onChange({
                target: { value: checked, name: 'marketingOptIn' }
              });
            }}
            disabled={isPending}
            className="mt-0.5 border-neutral-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
          />
          <Label
            htmlFor="marketingOptIn"
            className="cursor-pointer select-none text-sm font-normal leading-relaxed text-text-subtle peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {t('auth:marketing_opt_in', 'Yes, I would like to receive marketing communications about new features, updates, and special offers. I can unsubscribe at any time.')}
          </Label>
        </div>

        {/* Hidden Device ID Field */}
        <input
          type="hidden"
          {...register('deviceId')}
        />

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full bg-primary font-sans text-base font-semibold text-primary-foreground shadow-soft transition-all duration-300 hover:bg-primary-hover hover:shadow-lifted"
          isLoading={isPending}
          disabled={isPending || !isValid || !acceptedTerms}
          size="lg"
        >
          {isPending ? t('auth:creating_account', 'Creating Account...') : t('auth:create_account', 'Create Account')}
        </Button>
      </form>

      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      {/* DIVIDER */}
      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-neutral-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-3 font-medium text-text-muted">
            {t('common:or', 'Or')}
          </span>
        </div>
      </div>

      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      {/* LOGIN PROMPT */}
      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      <div className="space-y-4 text-center">
        <p className="text-sm text-text-subtle">
          {t('auth:have_account', 'Already have an account?')}
        </p>
        <Link
          to="/login"
          className="inline-flex items-center gap-2 rounded font-serif text-base font-semibold text-primary transition-all duration-300 hover:text-primary-hover hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          tabIndex={isPending ? -1 : 0}
        >
          {t('auth:sign_in_now', 'Sign In to Your Account')}
        </Link>
      </div>

      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      {/* SECURITY NOTICE - Enhanced with GDPR Compliance */}
      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      <div className="rounded-elegant border border-secondary/20 bg-secondary/5 p-4">
        <p className="flex items-start gap-3 text-xs leading-relaxed text-text-subtle">
          <Shield size={16} className="mt-0.5 flex-shrink-0 text-secondary" />
          <span>
            {t('auth:security_notice_registration', 'Your data is protected with enterprise-grade security. We use device tracking for enhanced security and comply with GDPR and KDPA requirements. Marketing communications are optional and can be managed in your account settings.')}
          </span>
        </p>
      </div>
    </div>
  );
}