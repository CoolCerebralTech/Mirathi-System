// FILE: src/features/auth/components/RegisterForm.tsx

import { useState, useEffect, useRef } from 'react';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Mail, 
  Lock, 
  User, 
  ShieldCheck, 
  CheckCircle2, 
  Info,
  Sparkles,
  ArrowRight,
  Fingerprint
} from 'lucide-react';

import {
  RegisterRequestSchema,
  type RegisterInput,
} from '../../../types/auth.types';
import { useRegister } from '../auth.api';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import { Checkbox } from '../../../components/ui/Checkbox';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';

// ============================================================================
// SUB-COMPONENT: Password Requirements Visualizer
// ============================================================================

function PasswordRequirements({ password, show }: { password: string; show: boolean }) {
  if (!show) return null;

  const requirements = [
    { met: password.length >= 8, label: 'At least 8 characters' },
    { met: /[A-Z]/.test(password), label: 'One uppercase letter' },
    { met: /[a-z]/.test(password), label: 'One lowercase letter' },
    { met: /[0-9]/.test(password), label: 'One number' },
    { met: /[^A-Za-z0-9]/.test(password), label: 'One special character' },
  ];

  return (
    <div className="mt-3 space-y-2 rounded-lg border border-neutral-200 bg-neutral-50 p-4 animate-in fade-in slide-in-from-top-2 duration-300">
      <p className="flex items-center gap-2 text-xs font-bold text-neutral-600 uppercase tracking-wider">
        <Info size={12} className="text-[#C8A165]" />
        Security Standards
      </p>
      <ul className="space-y-1.5">
        {requirements.map((req, index) => (
          <li
            key={index}
            className={`flex items-center gap-2 text-xs transition-colors duration-200 ${
              req.met ? 'text-emerald-600 font-medium' : 'text-neutral-400'
            }`}
          >
            {req.met ? (
              <CheckCircle2 size={14} className="flex-shrink-0 text-emerald-500" />
            ) : (
              <div className="h-3.5 w-3.5 flex-shrink-0 rounded-full border border-neutral-300" />
            )}
            <span>{req.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ============================================================================
// MAIN FORM
// ============================================================================

export function RegisterForm() {
  const { t } = useTranslation(['auth', 'validation', 'common']);
  const navigate = useNavigate();
  const { mutate: registerUser, isPending } = useRegister();
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);

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

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterRequestSchema),
    mode: 'onTouched',
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      passwordConfirmation: '',
      acceptedTerms: false,
      marketingOptIn: false,
    },
  });

  const watchedPassword = watch('password', '');

  const onSubmit: SubmitHandler<RegisterInput> = (formData) => {
    registerUser(
      {
        data: {
          ...formData,
          deviceId: deviceIdRef.current || undefined,
        },
        rememberMe: true,
      },
      {
        onSuccess: () => {
          navigate('/dashboard', { replace: true });
        },
      },
    );
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* HEADER */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0F3D3E]/5 border border-[#0F3D3E]/10">
          <Sparkles className="h-8 w-8 text-[#0F3D3E]" />
        </div>
        
        <h1 className="font-serif text-3xl font-bold tracking-tight text-[#0F3D3E] mb-3">
          {t('auth:create_account', 'Begin Your Legacy')}
        </h1>
        
        <p className="text-base text-neutral-600 leading-relaxed mb-6">
          {t('auth:get_started_prompt', 'Join the thousands of Kenyan families securing their future with Mirathi.')}
        </p>

        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-semibold text-emerald-700">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>{t('auth:secure_registration', 'Bank-Grade AES-256 Security')}</span>
        </div>
      </div>

      {/* FORM */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        
        {/* Name Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="firstName" className="text-sm font-semibold text-[#0F3D3E]">
              {t('auth:first_name', 'First Name')} <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <Input
                id="firstName"
                placeholder="John"
                autoComplete="given-name"
                disabled={isPending}
                className="pl-10"
                // ✅ FIXED: Pass string or undefined
                error={errors.firstName?.message} 
                {...register('firstName')}
              />
            </div>
            {/* Keeping explicit error message just in case Input doesn't display it */}
            {errors.firstName && (
              <p className="text-xs text-red-600 font-medium">{errors.firstName.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="lastName" className="text-sm font-semibold text-[#0F3D3E]">
              {t('auth:last_name', 'Last Name')} <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <Input
                id="lastName"
                placeholder="Kamau"
                autoComplete="family-name"
                disabled={isPending}
                className="pl-10"
                // ✅ FIXED: Pass string or undefined
                error={errors.lastName?.message}
                {...register('lastName')}
              />
            </div>
            {errors.lastName && (
              <p className="text-xs text-red-600 font-medium">{errors.lastName.message}</p>
            )}
          </div>
        </div>

        {/* Email */}
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
              disabled={isPending}
              className="pl-10"
              // ✅ FIXED: Pass string or undefined
              error={errors.email?.message}
              {...register('email')}
            />
          </div>
          {errors.email && (
            <p className="text-xs text-red-600 font-medium">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-sm font-semibold text-[#0F3D3E]">
            {t('auth:password', 'Password')} <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              disabled={isPending}
              onFocus={() => setShowPasswordRequirements(true)}
              className="pl-10"
              // ✅ FIXED: Pass string or undefined
              error={errors.password?.message}
              {...register('password')}
            />
          </div>
          
          <PasswordStrengthIndicator password={watchedPassword} />
          <PasswordRequirements password={watchedPassword} show={showPasswordRequirements} />
          
          {errors.password && (
            <p className="text-xs text-red-600 font-medium">{errors.password.message}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-1.5">
          <Label htmlFor="passwordConfirmation" className="text-sm font-semibold text-[#0F3D3E]">
            {t('auth:confirm_password', 'Confirm Password')} <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              id="passwordConfirmation"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              disabled={isPending}
              className="pl-10"
              error={errors.passwordConfirmation?.message}
              {...register('passwordConfirmation')}
            />
          </div>
          {errors.passwordConfirmation && (
            <p className="text-xs text-red-600 font-medium">{errors.passwordConfirmation.message}</p>
          )}
        </div>

        {/* Legal Consent */}
        <div className="space-y-4 pt-4">
          <div className="flex items-start gap-3">
            <Controller
              name="acceptedTerms"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="acceptedTerms"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isPending}
                  className="mt-1"
                />
              )}
            />
            <Label htmlFor="acceptedTerms" className="cursor-pointer text-sm text-neutral-600 leading-relaxed">
              I agree to the{' '}
              <Link to="/terms-of-service" className="text-[#0F3D3E] font-semibold hover:underline" target="_blank">
                Terms of Service
              </Link>
              {' '}and{' '}
              <Link to="/privacy-policy" className="text-[#0F3D3E] font-semibold hover:underline" target="_blank">
                Privacy Policy
              </Link>
              <span className="text-red-500 ml-1">*</span>
            </Label>
          </div>
          {errors.acceptedTerms && (
            <p className="text-xs text-red-600 font-medium">{errors.acceptedTerms.message}</p>
          )}

          <div className="flex items-start gap-3">
            <Controller
              name="marketingOptIn"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="marketingOptIn"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isPending}
                  className="mt-1"
                />
              )}
            />
            <Label htmlFor="marketingOptIn" className="cursor-pointer text-sm text-neutral-500 leading-relaxed">
              Send me guidance on Kenyan Succession Law and system updates.
            </Label>
          </div>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          className="group w-full bg-[#0F3D3E] hover:bg-[#0F3D3E]/90 text-white font-bold py-6 rounded-xl mt-4"
          isLoading={isPending}
          disabled={isPending}
          size="lg"
        >
          <div className="flex items-center justify-center gap-2">
            <span>
              {isPending 
                ? t('auth:creating_account', 'Securing Account...') 
                : t('auth:create_account', 'Create My Account')}
            </span>
            {!isPending && <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />}
          </div>
        </Button>
      </form>

      {/* FOOTER AREA */}
      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-neutral-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-3 font-semibold text-neutral-400 tracking-wider">
            {t('common:or', 'Already have an account?')}
          </span>
        </div>
      </div>

      <div className="text-center">
        <Link 
          to="/login" 
          className="inline-flex items-center gap-2 text-sm font-bold text-[#0F3D3E] hover:text-[#C8A165] transition-colors"
        >
          {t('auth:sign_in_now', 'Sign in to Mirathi')}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-8 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
        <div className="flex items-start gap-3 text-xs leading-relaxed text-neutral-500">
          <Fingerprint size={16} className="mt-0.5 flex-shrink-0 text-[#0F3D3E]" />
          <span>
            <strong>Device Verification Active:</strong> We register your device ID ({deviceIdRef.current?.slice(0,8)}...) to prevent unauthorized access.
          </span>
        </div>
      </div>
    </div>
  );
}