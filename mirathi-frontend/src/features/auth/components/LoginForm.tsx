// FILE: src/features/auth/components/LoginForm.tsx
import { useState, useRef, useEffect } from 'react';
import { useForm, type SubmitHandler, type UseFormRegisterReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, AlertCircle, Eye, EyeOff, ShieldCheck, LogIn, ArrowRight } from 'lucide-react';

import { LoginRequestSchema, type LoginInput } from '../../../types/auth.types'; // ✅ Corrected Path
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
  errorMessage?: string; 
  register: UseFormRegisterReturn;
}

function PasswordInput({ id, placeholder, disabled, errorMessage, register }: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const { t } = useTranslation(['auth']);
  
  return (
    <div className="relative">
      <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
      <Input
        id={id}
        type={showPassword ? 'text' : 'password'}
        placeholder={placeholder}
        autoComplete="current-password"
        disabled={disabled}
        error={errorMessage} // ✅ Passing string to Input
        className="pl-10 pr-10"
        {...register}
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        disabled={disabled}
        className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded text-neutral-400 transition-colors hover:text-[#0F3D3E] focus:outline-none focus:ring-2 focus:ring-[#0F3D3E]/20 disabled:cursor-not-allowed disabled:opacity-50"
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

  // Device Fingerprinting
  const deviceIdRef = useRef<string | null>(null);
  useEffect(() => {
    let id = localStorage.getItem('mirathi_device_id');
    if (!id) {
      id = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
      
      {/* HEADER */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0F3D3E]/5 border border-[#0F3D3E]/10">
          <LogIn className="h-8 w-8 text-[#0F3D3E]" />
        </div>
        
        <h1 className="font-serif text-3xl font-bold tracking-tight text-[#0F3D3E] mb-3">
          {t('auth:welcome_back', 'Welcome Back')}
        </h1>
        
        <p className="text-base text-neutral-600 leading-relaxed mb-6">
          {t('auth:sign_in_prompt', 'Sign in to access your secure Succession Dashboard.')}
        </p>

        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-semibold text-emerald-700">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>{t('auth:secure_login', 'Encrypted Connection')}</span>
        </div>
      </div>

      {/* FORM */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        
        {/* Email Field */}
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-sm font-semibold text-[#0F3D3E]">
            {t('auth:email', 'Email Address')} <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              autoComplete="email"
              autoFocus
              disabled={isPending}
              className="pl-10"
              error={errors.email?.message}
              {...register('email')}
            />
          </div>
          {errors.email && (
            <p className="flex items-center gap-1.5 text-xs text-red-600 font-medium">
              <AlertCircle size={12} />
              <span>{errors.email.message}</span>
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-semibold text-[#0F3D3E]">
              {t('auth:password', 'Password')} <span className="text-red-500">*</span>
            </Label>
            <Link 
              to="/forgot-password" 
              className="text-sm font-medium text-[#C8A165] hover:text-[#b08d55] hover:underline transition-colors"
            >
              {t('auth:forgot_password', 'Forgot Password?')}
            </Link>
          </div>
          <PasswordInput
            id="password"
            placeholder="••••••••"
            disabled={isPending}
            errorMessage={errors.password?.message}
            register={register('password')}
          />
          {errors.password && (
            <p className="flex items-center gap-1.5 text-xs text-red-600 font-medium">
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
            className="border-neutral-400 data-[state=checked]:bg-[#0F3D3E] data-[state=checked]:border-[#0F3D3E]"
          />
          <Label htmlFor="remember" className="cursor-pointer text-sm text-neutral-600 leading-none">
            {t('auth:remember_me', 'Keep me signed in for 30 days')}
          </Label>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="group w-full bg-[#0F3D3E] hover:bg-[#0F3D3E]/90 text-white font-bold py-3.5 rounded-xl mt-4"
          size="lg"
          isLoading={isPending}
          disabled={isPending}
        >
          <div className="flex items-center justify-center gap-2">
            <span>
              {isPending 
                ? t('auth:signing_in', 'Verifying Credentials...') 
                : t('auth:sign_in', 'Access Dashboard')}
            </span>
            {!isPending && <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />}
          </div>
        </Button>
      </form>

      {/* FOOTER */}
      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-neutral-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-3 font-semibold text-neutral-400 tracking-wider">
            {t('common:or', 'New to Mirathi?')}
          </span>
        </div>
      </div>

      <div className="text-center">
        <Link 
          to="/register" 
          className="inline-flex items-center gap-2 text-sm font-bold text-[#0F3D3E] hover:text-[#C8A165] transition-colors"
        >
          {t('auth:sign_up_now', 'Create an account')}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-8 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
        <div className="flex items-start gap-3 text-xs leading-relaxed text-neutral-500">
          <ShieldCheck size={16} className="mt-0.5 flex-shrink-0 text-[#0F3D3E]" />
          <span>
            {t('auth:security_notice', 'For your protection, we log all access attempts. Your session is protected by 256-bit SSL encryption.')}
          </span>
        </div>
      </div>
    </div>
  );
}