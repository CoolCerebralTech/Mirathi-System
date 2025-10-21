// ============================================================================
// LoginForm.tsx - User Authentication Form Component
// ============================================================================
// Production-ready login form with comprehensive validation, remember me
// functionality, enhanced security, and accessible UI.
// ============================================================================

import { useState } from 'react';
import { useForm, type UseFormRegister } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, LogIn, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

import { LoginRequestSchema, type LoginInput } from '../../../types';
import { useLogin } from '../auth.api';
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
      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <Input
        id={id}
        type={showPassword ? 'text' : 'password'}
        placeholder={placeholder}
        autoComplete="current-password"
        disabled={disabled}
        aria-invalid={error}
        aria-describedby={errorId}
        className="pl-10 pr-10"
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
  );
}

// ============================================================================
// MAIN LOGIN FORM
// ============================================================================

/**
 * Login form component for user authentication.
 * 
 * FEATURES:
 * - Email and password validation
 * - Password visibility toggle
 * - Remember me functionality
 * - Form state management with React Hook Form
 * - Accessible error messages
 * - Loading states
 * - Redirect after successful login
 * - "Forgot password" link
 * - "Sign up" link for new users
 * 
 * SECURITY:
 * - Password masking by default
 * - Remember me controls token persistence
 * - Protected routes redirect after login
 * - Rate limiting handled at API level
 */
export function LoginForm() {
  const { t } = useTranslation(['auth', 'validation', 'common']);
  const navigate = useNavigate();
  const location = useLocation();
  const { mutate: login, isPending } = useLogin();
  
  const [rememberMe, setRememberMe] = useState(false);

  // Get redirect path from location state or default to dashboard
  const from = (location.state as { from?: string })?.from || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginRequestSchema),
    mode: 'onTouched', // Validate after user leaves field
    defaultValues: {
      email: '',
      password: '',
    },
  });

  /**
   * Form submission handler
   * Authenticates user and redirects on success
   */
  const onSubmit = (formData: LoginInput) => {
    login(
      { data: formData, rememberMe },
      {
        onSuccess: () => {
          toast.success(t('auth:login_success'), {
            description: t('auth:login_success_description'),
            duration: 3000,
          });
          
          // Navigate to intended destination or dashboard
          navigate(from, { replace: true });
        },
        onError: (error) => {
          const errorMessage = extractErrorMessage(error);
          
          toast.error(t('auth:login_failed_title'), {
            description: errorMessage,
            duration: 5000,
          });
        },
      },
    );
  };

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <LogIn className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold">
          {t('auth:welcome_back')}
        </CardTitle>
        <CardDescription className="text-base">
          {t('auth:sign_in_prompt')}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email" required>
              {t('auth:email')}
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                id="email"
                type="email"
                placeholder={t('auth:email_placeholder')}
                autoComplete="email"
                autoFocus
                disabled={isPending}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
                className="pl-10"
                {...register('email')}
              />
            </div>
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

          {/* Password Field with Visibility Toggle */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" required>
                {t('auth:password')}
              </Label>
              <Link
                to="/forgot-password"
                className="text-sm font-medium text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded transition-colors"
                tabIndex={isPending ? -1 : 0}
              >
                {t('auth:forgot_password')}
              </Link>
            </div>
            
            <PasswordInput
              id="password"
              placeholder={t('auth:password_placeholder_login')}
              disabled={isPending}
              error={!!errors.password}
              errorId={errors.password ? 'password-error' : undefined}
              register={register('password')}
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

          {/* Remember Me Checkbox */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                disabled={isPending}
                aria-describedby="remember-description"
              />
              <div className="space-y-0.5">
                <Label
                  htmlFor="remember"
                  className="cursor-pointer select-none font-normal text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {t('auth:remember_me')}
                </Label>
              </div>
            </div>
          </div>

          {/* Remember Me Description (Optional) */}
          <p
            id="remember-description"
            className="text-xs text-muted-foreground"
          >
            {t('auth:remember_me_description')}
          </p>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            size="lg"
            isLoading={isPending}
            disabled={isPending || !isValid}
          >
            {isPending ? t('auth:signing_in') : t('auth:sign_in')}
          </Button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-muted" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              {t('common:or')}
            </span>
          </div>
        </div>

        {/* Sign Up Link */}
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            {t('auth:no_account')}
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 font-semibold text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded transition-colors"
            tabIndex={isPending ? -1 : 0}
          >
            {t('auth:sign_up_now')}
          </Link>
        </div>

        {/* Optional: Security Notice */}
        <div className="mt-6 rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
          <p className="flex items-start gap-2">
            <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
            <span>
              {t('auth:security_notice')}
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
