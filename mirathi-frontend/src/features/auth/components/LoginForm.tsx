// FILE: src/features/auth/components/LoginForm.tsx
import { useState, useRef, useEffect } from 'react';
import { useForm, type SubmitHandler, type UseFormRegisterReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, AlertCircle, Eye, EyeOff, ShieldCheck, ArrowRight } from 'lucide-react';

import { LoginRequestSchema, type LoginInput } from '../../../types/auth.types';
import { useLogin } from '../auth.api';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import { Checkbox } from '../../../components/ui/Checkbox';

/**
 * Internal Password Input Component
 */
function PasswordInput({
  id,
  placeholder,
  disabled,
  errorMessage,
  register,
}: {
  id: string;
  placeholder?: string;
  disabled?: boolean;
  errorMessage?: string;
  register: UseFormRegisterReturn;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const { t } = useTranslation(['auth']);
  
  return (
    <div className="relative">
      <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
      <Input
        id={id}
        type={showPassword ? 'text' : 'password'}
        placeholder={placeholder}
        autoComplete="current-password"
        disabled={disabled}
        aria-invalid={!!errorMessage}
        className={`pl-11 pr-11 h-11 border-slate-300 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all ${
          errorMessage ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : ''
        }`}
        error={errorMessage}
        {...register}
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        disabled={disabled}
        className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 focus:text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 rounded-md disabled:opacity-40 transition-colors"
        aria-label={showPassword ? t('auth:hide_password') : t('auth:show_password')}
      >
        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}

export function LoginForm() {
  const { t } = useTranslation(['auth', 'common']);
  const navigate = useNavigate();
  const location = useLocation();
  const { mutate: login, isPending } = useLogin();
  const [rememberMe, setRememberMe] = useState(true);

  // Device ID Logic
  const deviceIdRef = useRef<string | null>(null);
  useEffect(() => {
    let id = localStorage.getItem('mirathi_device_id');
    if (!id) {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        id = crypto.randomUUID();
      } else {
        id = `device_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      }
      localStorage.setItem('mirathi_device_id', id);
    }
    deviceIdRef.current = id;
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
      },
    );
  };

  return (
    <div className="w-full max-w-md mx-auto">
      
      {/* Header Section */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-slate-50 text-emerald-700 border border-slate-100 shadow-sm mb-6">
          <ShieldCheck className="h-7 w-7" />
        </div>
        
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight sm:text-3xl">
          {t('auth:welcome_back', 'Sign in to Mirathi')}
        </h1>
        
        <p className="mt-3 text-base text-slate-500 leading-relaxed">
          {t('auth:sign_in_prompt', 'Access your secure succession dashboard')}
        </p>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Email Field */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-semibold text-slate-700">
            {t('auth:email', 'Email Address')}
          </Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              autoComplete="email"
              autoFocus
              disabled={isPending}
              aria-invalid={!!errors.email}
              className={`pl-11 h-11 border-slate-300 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all ${
                errors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : ''
              }`}
              error={errors.email?.message}
              {...register('email')}
            />
          </div>
          {errors.email?.message && (
            <p className="text-sm text-red-600 flex items-center gap-1.5 mt-1 font-medium animate-in fade-in slide-in-from-top-1">
              <AlertCircle size={14} />
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-semibold text-slate-700">
              {t('auth:password', 'Password')}
            </Label>
            <Link
              to="/forgot-password"
              className="text-sm text-emerald-700 hover:text-emerald-800 hover:underline font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-sm px-1 -mr-1"
            >
              {t('auth:forgot_password', 'Forgot password?')}
            </Link>
          </div>
          
          <PasswordInput
            id="password"
            placeholder="••••••••"
            disabled={isPending}
            errorMessage={errors.password?.message}
            register={register('password')}
          />
          
          {errors.password?.message && (
            <p className="text-sm text-red-600 flex items-center gap-1.5 mt-1 font-medium animate-in fade-in slide-in-from-top-1">
              <AlertCircle size={14} />
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Remember Me Checkbox */}
        <div className="flex items-center gap-3 pt-1">
          <Checkbox
            id="remember"
            checked={rememberMe}
            onCheckedChange={(checked) => setRememberMe(checked as boolean)}
            disabled={isPending}
            className="border-slate-300 data-[state=checked]:bg-slate-900 data-[state=checked]:border-slate-900 h-5 w-5"
          />
          <Label
            htmlFor="remember"
            className="text-sm text-slate-600 cursor-pointer select-none font-medium"
          >
            {t('auth:remember_me', 'Keep me signed in')}
          </Label>
        </div>

        {/* Primary Action Button */}
        <Button
          type="submit"
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold h-12 rounded-lg mt-4 shadow-sm transition-all focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
          size="lg"
          disabled={isPending}
          isLoading={isPending}
        >
          {isPending ? (
            t('auth:signing_in', 'Verifying credentials...')
          ) : (
            <span className="flex items-center gap-2">
              {t('auth:sign_in', 'Sign In')} 
              <ArrowRight size={18} className="opacity-80" />
            </span>
          )}
        </Button>
      </form>

      {/* Footer / Registration Link */}
      <div className="mt-8 space-y-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-4 text-slate-500 font-medium">
              {t('common:new_to_mirathi', 'New to Mirathi?')}
            </span>
          </div>
        </div>

        <div className="text-center">
          <Link
            to="/register"
            className="inline-flex items-center justify-center w-full px-4 py-3 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-all focus:outline-none focus:ring-2 focus:ring-slate-200"
          >
            {t('auth:create_account', "Create your free account")}
          </Link>
        </div>
      </div>
    </div>
  );
}