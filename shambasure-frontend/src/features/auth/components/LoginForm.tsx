// ============================================================================
// LoginForm.tsx - Updated Authentication Form
// ============================================================================

import { useState } from 'react';
import { useForm, type UseFormRegister } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, LogIn, AlertCircle, Eye, EyeOff, Shield } from 'lucide-react';
import { toast } from 'sonner';

import { LoginRequestSchema, type LoginInput } from '../../../types';
import { useLogin } from '../auth.api';
import { extractErrorMessage } from '../../../api/client';

import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import { Checkbox } from '../../../components/ui/Checkbox';

// ============================================================================
// PASSWORD VISIBILITY TOGGLE
// ============================================================================

interface PasswordInputProps {
  id: string;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  errorId?: string;
  register: ReturnType<UseFormRegister<LoginInput>>;
}

function PasswordInput({
  id,
  placeholder,
  disabled,
  error,
  errorId,
  register,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const { t } = useTranslation(['auth']);

  return (
    <div className="relative">
      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
      <Input
        id={id}
        type={showPassword ? 'text' : 'password'}
        placeholder={placeholder}
        autoComplete="current-password"
        disabled={disabled}
        aria-invalid={error}
        aria-describedby={errorId}
        className={`
          pl-10 pr-10 
          border-neutral-300 bg-background 
          transition-all duration-300 
          focus:border-primary focus:ring-2 focus:ring-primary/20
          ${error ? 'border-danger focus:border-danger focus:ring-danger/20' : ''}
        `}
        {...register}
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        disabled={disabled}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded text-text-muted transition-colors hover:text-text focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        aria-label={showPassword ? t('auth:hide_password') : t('auth:show_password')}
        tabIndex={disabled ? -1 : 0}
      >
        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

// ============================================================================
// DEVICE ID GENERATION
// ============================================================================

/**
 * Generate a persistent device identifier for session tracking
 */
const generateDeviceId = (): string => {
  // Try to get existing device ID from localStorage
  const existingDeviceId = localStorage.getItem('shamba_device_id');
  if (existingDeviceId) {
    return existingDeviceId;
  }

  // Generate new device ID
  const newDeviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  localStorage.setItem('shamba_device_id', newDeviceId);
  return newDeviceId;
};

// ============================================================================
// MAIN LOGIN FORM - UPDATED WITH DEVICE TRACKING
// ============================================================================

export function LoginForm() {
  const { t } = useTranslation(['auth', 'validation', 'common']);
  const navigate = useNavigate();
  const location = useLocation();
  const { mutate: login, isPending } = useLogin();
  
  const [rememberMe, setRememberMe] = useState(false);

  const from = (location.state as { from?: string })?.from || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginRequestSchema),
    mode: 'onTouched',
    defaultValues: {
      email: '',
      password: '',
      deviceId: generateDeviceId(),
      // ipAddress and userAgent will be set by backend from request headers
    },
  });

  const onSubmit = (formData: LoginInput) => {
    // Ensure deviceId is always set
    const loginData: LoginInput = {
      ...formData,
      deviceId: formData.deviceId || generateDeviceId(),
    };

    login(
      { data: loginData, rememberMe },
      {
        onSuccess: () => {
          toast.success(t('auth:login_success', 'Welcome back!'), {
            description: t('auth:login_success_description', 'Redirecting to your dashboard...'),
            duration: 3000,
          });
          navigate(from, { replace: true });
        },
        onError: (error) => {
          const errorMessage = extractErrorMessage(error);
          toast.error(t('auth:login_failed_title', 'Authentication Failed'), {
            description: errorMessage,
            duration: 5000,
          });
        },
      },
    );
  };

  return (
    <div className="w-full space-y-8">
      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      {/* HEADER - Elegant & Trust-Building */}
      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      <div className="space-y-4 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary/20 bg-primary/5 shadow-soft">
          <LogIn className="h-8 w-8 text-primary" />
        </div>
        
        <div className="space-y-2">
          <h1 className="font-display text-3xl font-bold tracking-tight text-text sm:text-4xl">
            {t('auth:welcome_back', 'Welcome Back')}
          </h1>
          <p className="text-base leading-relaxed text-text-subtle">
            {t('auth:sign_in_prompt', 'Sign in to access your family\'s land succession dashboard')}
          </p>
        </div>

        {/* Security Badge */}
        <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-secondary/20 bg-secondary/5 px-4 py-1.5 text-xs font-medium text-secondary">
          <Shield className="h-3.5 w-3.5" />
          <span>{t('auth:secure_login', 'Secure Login')}</span>
        </div>
      </div>

      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      {/* FORM - Clean & Refined */}
      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        
        {/* Email Field */}
        <div className="space-y-2">
          <Label 
            htmlFor="email" 
            className="font-serif text-sm font-semibold text-text"
          >
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
              autoFocus
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
            <p
              id="email-error"
              className="flex items-center gap-1.5 text-sm text-danger"
              role="alert"
            >
              <AlertCircle size={14} className="flex-shrink-0" />
              <span>{errors.email.message}</span>
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label 
              htmlFor="password" 
              className="font-serif text-sm font-semibold text-text"
            >
              {t('auth:password', 'Password')}
              <span className="ml-1 text-danger">*</span>
            </Label>
            <Link
              to="/forgot-password"
              className="rounded text-sm font-medium text-primary transition-colors hover:text-primary-hover hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              tabIndex={isPending ? -1 : 0}
            >
              {t('auth:forgot_password', 'Forgot?')}
            </Link>
          </div>
          
          <PasswordInput
            id="password"
            placeholder={t('auth:password_placeholder_login', 'Enter your password')}
            disabled={isPending}
            error={!!errors.password}
            errorId={errors.password ? 'password-error' : undefined}
            register={register('password')}
          />

          {errors.password && (
            <p
              id="password-error"
              className="flex items-center gap-1.5 text-sm text-danger"
              role="alert"
            >
              <AlertCircle size={14} className="flex-shrink-0" />
              <span>{errors.password.message}</span>
            </p>
          )}
        </div>

        {/* Remember Me */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="remember"
            checked={rememberMe}
            onCheckedChange={(checked) => setRememberMe(checked as boolean)}
            disabled={isPending}
            className="border-neutral-300"
          />
          <Label
            htmlFor="remember"
            className="cursor-pointer select-none text-sm font-normal leading-none text-text-subtle peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {t('auth:remember_me', 'Keep me signed in for 30 days')}
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
          size="lg"
          isLoading={isPending}
          disabled={isPending || !isValid}
        >
          {isPending ? t('auth:signing_in', 'Signing in...') : t('auth:sign_in', 'Sign In')}
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
      {/* SIGN UP PROMPT - Elegant */}
      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      <div className="space-y-4 text-center">
        <p className="text-sm text-text-subtle">
          {t('auth:no_account', 'Don\'t have an account yet?')}
        </p>
        <Link
          to="/register"
          className="inline-flex items-center gap-2 rounded font-serif text-base font-semibold text-primary transition-all duration-300 hover:text-primary-hover hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          tabIndex={isPending ? -1 : 0}
        >
          {t('auth:sign_up_now', 'Create Your Account')}
        </Link>
      </div>

      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      {/* SECURITY NOTICE - Enhanced with Device Tracking Info */}
      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      <div className="rounded-elegant border border-secondary/20 bg-secondary/5 p-4">
        <p className="flex items-start gap-3 text-xs leading-relaxed text-text-subtle">
          <Shield size={16} className="mt-0.5 flex-shrink-0 text-secondary" />
          <span>
            {t('auth:security_notice', 'Your connection is encrypted and secure. We use device tracking for enhanced security and comply with all KDPA requirements.')}
          </span>
        </p>
      </div>
    </div>
  );
}