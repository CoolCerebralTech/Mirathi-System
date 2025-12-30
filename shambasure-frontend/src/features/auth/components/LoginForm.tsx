import { useState, useRef, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, AlertCircle, Eye, EyeOff, ShieldCheck, LogIn, ArrowRight } from 'lucide-react';

import { LoginRequestSchema, type LoginInput } from '../../../types';
import { useLogin } from '../auth.api';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import { Checkbox } from '../../../components/ui/Checkbox';

// ============================================================================
// PASSWORD INPUT SUB-COMPONENT
// ============================================================================
interface PasswordInputProps {
  id: string;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  errorId?: string;
  register: ReturnType<ReturnType<typeof useForm<LoginInput>>['register']>;
}

function PasswordInput({ id, placeholder, disabled, error, errorId, register }: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const { t } = useTranslation(['auth']);
  
  return (
    <div className="relative">
      <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
      <Input
        id={id}
        type={showPassword ? 'text' : 'password'}
        placeholder={placeholder}
        autoComplete="current-password"
        disabled={disabled}
        aria-invalid={error}
        aria-describedby={errorId}
        className={`pl-10 pr-10 bg-slate-900/50 text-white placeholder:text-slate-600 border ${
          error ? 'border-red-500/50 focus:border-red-500' : 'border-slate-700/50 focus:border-amber-500'
        } focus:ring-2 focus:ring-amber-500/20 transition-all`}
        {...register}
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        disabled={disabled}
        className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded text-slate-500 transition-colors hover:text-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/50 disabled:cursor-not-allowed disabled:opacity-50"
        aria-label={showPassword ? t('auth:hide_password', 'Hide password') : t('auth:show_password', 'Show password')}
      >
        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

// ============================================================================
// MAIN LOGIN FORM
// ============================================================================
export function LoginForm() {
  const { t } = useTranslation(['auth', 'validation', 'common']);
  const navigate = useNavigate();
  const location = useLocation();
  const { mutate: login, isPending } = useLogin();
  const [rememberMe, setRememberMe] = useState(true);

  const deviceIdRef = useRef<string | null>(null);
  useEffect(() => {
    const getDeviceId = () => {
      let id = localStorage.getItem('mirathi_device_id');
      if (!id) {
        id = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('mirathi_device_id', id);
      }
      return id;
    };
    deviceIdRef.current = getDeviceId();
  }, []);

  const from = (location.state as { from?: string })?.from || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginRequestSchema),
    mode: 'onTouched',
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit: SubmitHandler<LoginInput> = (formData) => {
    login(
      {
        data: {
          ...formData,
          deviceId: deviceIdRef.current || undefined,
        },
        rememberMe,
      },
      {
        onSuccess: () => {
          navigate(from, { replace: true });
        },
        onError: (error) => {
          console.error("Login error:", error);
        },
      },
    );
  };

  return (
    <div className="w-full max-w-md mx-auto">
      
      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      {/* HEADER */}
      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/20 shadow-xl shadow-amber-500/10">
          <LogIn className="h-10 w-10 text-amber-400" />
        </div>
        
        <h1 className="font-serif text-3xl font-bold tracking-tight text-white mb-3">
          {t('auth:welcome_back', 'Welcome Back')}
        </h1>
        
        <p className="text-base text-slate-400 leading-relaxed mb-6">
          {t('auth:sign_in_prompt', 'Sign in to access your succession planning dashboard.')}
        </p>

        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-400">
          <ShieldCheck className="h-4 w-4" />
          <span>{t('auth:secure_login', 'Secure Login')}</span>
        </div>
      </div>

      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      {/* FORM */}
      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      <div className="space-y-5">
        
        {/* Email Field */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-slate-300">
            {t('auth:email', 'Email Address')}
            <span className="ml-1 text-amber-400">*</span>
          </Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              id="email"
              type="email"
              placeholder={t('auth:email_placeholder', 'you@example.com')}
              autoComplete="email"
              autoFocus
              disabled={isPending}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : undefined}
              className={`pl-10 bg-slate-900/50 text-white placeholder:text-slate-600 border ${
                errors.email ? 'border-red-500/50 focus:border-red-500' : 'border-slate-700/50 focus:border-amber-500'
              } focus:ring-2 focus:ring-amber-500/20 transition-all`}
              {...register('email')}
            />
          </div>
          {errors.email && (
            <p id="email-error" className="flex items-center gap-1.5 text-xs text-red-400" role="alert">
              <AlertCircle size={12} />
              <span>{errors.email.message}</span>
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-medium text-slate-300">
              {t('auth:password', 'Password')}
              <span className="ml-1 text-amber-400">*</span>
            </Label>
            <Link 
              to="/forgot-password" 
              className="text-sm font-medium text-amber-400 hover:text-amber-300 transition-colors"
            >
              {t('auth:forgot_password', 'Forgot?')}
            </Link>
          </div>
          <PasswordInput
            id="password"
            placeholder={t('auth:password_placeholder_login', '••••••••')}
            disabled={isPending}
            error={!!errors.password}
            errorId={errors.password ? 'password-error' : undefined}
            register={register('password')}
          />
          {errors.password && (
            <p id="password-error" className="flex items-center gap-1.5 text-xs text-red-400" role="alert">
              <AlertCircle size={12} />
              <span>{errors.password.message}</span>
            </p>
          )}
        </div>

        {/* Remember Me */}
        <div className="flex items-center gap-3 pt-1">
          <Checkbox
            id="remember"
            checked={rememberMe}
            onCheckedChange={(checked) => setRememberMe(checked as boolean)}
            disabled={isPending}
            className="border-slate-600 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
          />
          <Label htmlFor="remember" className="cursor-pointer text-sm text-slate-400 leading-none">
            {t('auth:remember_me', 'Keep me signed in for 30 days')}
          </Label>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          onClick={handleSubmit(onSubmit)}
          className="group w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold py-3.5 rounded-xl shadow-lg shadow-amber-500/20 hover:shadow-xl hover:shadow-amber-500/30 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
          size="lg"
          isLoading={isPending}
          disabled={isPending}
        >
          <div className="flex items-center justify-center gap-2">
            <span>
              {isPending 
                ? t('auth:signing_in', 'Signing In...') 
                : t('auth:sign_in', 'Sign In')}
            </span>
            {!isPending && <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />}
          </div>
        </Button>
      </div>

      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      {/* DIVIDER */}
      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-800" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-slate-950 px-3 font-medium text-slate-600">
            {t('common:or', 'New to Mirathi?')}
          </span>
        </div>
      </div>

      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      {/* REGISTER LINK */}
      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      <div className="text-center">
        <Link 
          to="/register" 
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-amber-400 transition-colors"
        >
          {t('auth:sign_up_now', 'Create an account')}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      {/* SECURITY NOTICE */}
      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      <div className="mt-8 rounded-xl border border-slate-800/50 bg-slate-900/30 p-4">
        <p className="flex items-start gap-3 text-xs leading-relaxed text-slate-500">
          <ShieldCheck size={16} className="mt-0.5 flex-shrink-0 text-emerald-500" />
          <span>
            {t('auth:security_notice', 'All login attempts are logged for your security. We use device fingerprinting to detect unauthorized access.')}
          </span>
        </p>
      </div>
    </div>
  );
}