import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Mail, 
  Lock, 
  User, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Info,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

import {
  RegisterRequestSchema,
  type RegisterInput,
} from '../../../types';
import { useRegister } from '../auth.api';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import { Checkbox } from '../../../components/ui/Checkbox';
import { PasswordStrengthIndicator } from '../../../components/auth/PasswordStrengthIndicator';
import type { SubmitHandler } from 'react-hook-form';

// ============================================================================
// PASSWORD REQUIREMENTS COMPONENT
// ============================================================================

interface PasswordRequirementsProps {
  password: string;
  show: boolean;
}

function PasswordRequirements({ password, show }: PasswordRequirementsProps) {
  if (!show) return null;

  const requirements = [
    { met: password.length >= 8, label: 'At least 8 characters' },
    { met: /[A-Z]/.test(password), label: 'One uppercase letter' },
    { met: /[a-z]/.test(password), label: 'One lowercase letter' },
    { met: /[0-9]/.test(password), label: 'One number' },
    { met: /[^A-Za-z0-9]/.test(password), label: 'One special character' },
  ];

  return (
    <div className="mt-3 space-y-2 rounded-xl border border-slate-700/50 bg-slate-900/30 p-4">
      <p className="flex items-center gap-2 text-xs font-semibold text-slate-300">
        <Info size={14} className="text-amber-400" />
        Password Requirements
      </p>
      <ul className="space-y-1.5">
        {requirements.map((req, index) => (
          <li
            key={index}
            className={`flex items-center gap-2 text-xs transition-colors duration-200 ${
              req.met ? 'text-emerald-400' : 'text-slate-500'
            }`}
          >
            {req.met ? (
              <CheckCircle2 size={14} className="flex-shrink-0" />
            ) : (
              <div className="h-3.5 w-3.5 flex-shrink-0 rounded-full border border-slate-700" />
            )}
            <span>{req.label}</span>
          </li>
        ))}
      </ul>
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
          navigate('/pending-verification', {
            replace: true,
            state: { email: formData.email },
          });
        },
        onError: (error) => {
          console.error("Registration error:", error);
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
          <Sparkles className="h-10 w-10 text-amber-400" />
        </div>
        
        <h1 className="font-serif text-3xl font-bold tracking-tight text-white mb-3">
          {t('auth:create_account', 'Create Your Account')}
        </h1>
        
        <p className="text-base text-slate-400 leading-relaxed mb-6">
          {t('auth:get_started_prompt', 'Join thousands of Kenyan families protecting their legacy with Mirathi.')}
        </p>

        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-400">
          <ShieldCheck className="h-4 w-4" />
          <span>{t('auth:secure_registration', 'Encrypted & Secure')}</span>
        </div>
      </div>

      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      {/* FORM */}
      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      <div onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        
        {/* Name Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName" className="text-sm font-medium text-slate-300">
              {t('auth:first_name', 'First Name')}
              <span className="ml-1 text-amber-400">*</span>
            </Label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input
                id="firstName"
                type="text"
                placeholder={t('auth:first_name_placeholder', 'John')}
                autoComplete="given-name"
                disabled={isPending}
                className={`pl-10 bg-slate-900/50 text-white placeholder:text-slate-600 border ${
                  errors.firstName ? 'border-red-500/50 focus:border-red-500' : 'border-slate-700/50 focus:border-amber-500'
                } focus:ring-2 focus:ring-amber-500/20 transition-all`}
                {...register('firstName')}
              />
            </div>
            {errors.firstName && (
              <p className="flex items-center gap-1.5 text-xs text-red-400">
                <AlertCircle size={12} />
                <span>{errors.firstName.message as string}</span>
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName" className="text-sm font-medium text-slate-300">
              {t('auth:last_name', 'Last Name')}
              <span className="ml-1 text-amber-400">*</span>
            </Label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input
                id="lastName"
                type="text"
                placeholder={t('auth:last_name_placeholder', 'Doe')}
                autoComplete="family-name"
                disabled={isPending}
                className={`pl-10 bg-slate-900/50 text-white placeholder:text-slate-600 border ${
                  errors.lastName ? 'border-red-500/50 focus:border-red-500' : 'border-slate-700/50 focus:border-amber-500'
                } focus:ring-2 focus:ring-amber-500/20 transition-all`}
                {...register('lastName')}
              />
            </div>
            {errors.lastName && (
              <p className="flex items-center gap-1.5 text-xs text-red-400">
                <AlertCircle size={12} />
                <span>{errors.lastName.message as string}</span>
              </p>
            )}
          </div>
        </div>

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
              disabled={isPending}
              className={`pl-10 bg-slate-900/50 text-white placeholder:text-slate-600 border ${
                errors.email ? 'border-red-500/50 focus:border-red-500' : 'border-slate-700/50 focus:border-amber-500'
              } focus:ring-2 focus:ring-amber-500/20 transition-all`}
              {...register('email')}
            />
          </div>
          {errors.email && (
            <p className="flex items-center gap-1.5 text-xs text-red-400">
              <AlertCircle size={12} />
              <span>{errors.email.message as string}</span>
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium text-slate-300">
            {t('auth:password', 'Password')}
            <span className="ml-1 text-amber-400">*</span>
          </Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              id="password"
              type="password"
              placeholder={t('auth:password_placeholder', '••••••••')}
              autoComplete="new-password"
              disabled={isPending}
              onFocus={() => setShowPasswordRequirements(true)}
              className={`pl-10 bg-slate-900/50 text-white placeholder:text-slate-600 border ${
                errors.password ? 'border-red-500/50 focus:border-red-500' : 'border-slate-700/50 focus:border-amber-500'
              } focus:ring-2 focus:ring-amber-500/20 transition-all`}
              {...register('password')}
            />
          </div>
          <PasswordStrengthIndicator password={watchedPassword} />
          <PasswordRequirements password={watchedPassword} show={showPasswordRequirements} />
          {errors.password && (
            <p className="flex items-center gap-1.5 text-xs text-red-400">
              <AlertCircle size={12} />
              <span>{errors.password.message as string}</span>
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-2">
          <Label htmlFor="passwordConfirmation" className="text-sm font-medium text-slate-300">
            {t('auth:confirm_password', 'Confirm Password')}
            <span className="ml-1 text-amber-400">*</span>
          </Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              id="passwordConfirmation"
              type="password"
              placeholder={t('auth:confirm_password_placeholder', '••••••••')}
              autoComplete="new-password"
              disabled={isPending}
              className={`pl-10 bg-slate-900/50 text-white placeholder:text-slate-600 border ${
                errors.passwordConfirmation ? 'border-red-500/50 focus:border-red-500' : 'border-slate-700/50 focus:border-amber-500'
              } focus:ring-2 focus:ring-amber-500/20 transition-all`}
              {...register('passwordConfirmation')}
            />
          </div>
          {errors.passwordConfirmation && (
            <p className="flex items-center gap-1.5 text-xs text-red-400">
              <AlertCircle size={12} />
              <span>{errors.passwordConfirmation.message as string}</span>
            </p>
          )}
        </div>

        {/* Terms & Conditions */}
        <div className="space-y-4 pt-2">
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
                  className="mt-1 border-slate-600 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                />
              )}
            />
            <Label htmlFor="acceptedTerms" className="cursor-pointer text-sm text-slate-400 leading-relaxed">
              I agree to the{' '}
              <Link to="/terms" className="text-amber-400 hover:text-amber-300 underline" target="_blank">
                Terms of Service
              </Link>
              {' '}and{' '}
              <Link to="/privacy" className="text-amber-400 hover:text-amber-300 underline" target="_blank">
                Privacy Policy
              </Link>
              <span className="ml-1 text-amber-400">*</span>
            </Label>
          </div>
          {errors.acceptedTerms && (
            <p className="flex items-center gap-1.5 text-xs text-red-400">
              <AlertCircle size={12} />
              <span>{errors.acceptedTerms.message as string}</span>
            </p>
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
                  className="mt-1 border-slate-600 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                />
              )}
            />
            <Label htmlFor="marketingOptIn" className="cursor-pointer text-sm text-slate-500 leading-relaxed">
              Send me updates about succession law and Mirathi features
            </Label>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          onClick={handleSubmit(onSubmit)}
          className="group w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold py-3.5 rounded-xl shadow-lg shadow-amber-500/20 hover:shadow-xl hover:shadow-amber-500/30 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
          isLoading={isPending}
          disabled={isPending}
          size="lg"
        >
          <div className="flex items-center justify-center gap-2">
            <span>
              {isPending 
                ? t('auth:creating_account', 'Creating Account...') 
                : t('auth:create_account', 'Create Account')}
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
            {t('common:or', 'Already have an account?')}
          </span>
        </div>
      </div>

      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      {/* LOGIN LINK */}
      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      <div className="text-center">
        <Link 
          to="/login" 
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-amber-400 transition-colors"
        >
          {t('auth:sign_in_now', 'Sign in to your account')}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      {/* COMPLIANCE NOTICE */}
      {/* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= */}
      <div className="mt-8 rounded-xl border border-slate-800/50 bg-slate-900/30 p-4">
        <p className="flex items-start gap-3 text-xs leading-relaxed text-slate-500">
          <ShieldCheck size={16} className="mt-0.5 flex-shrink-0 text-emerald-500" />
          <span>
            Protected by AES-256 encryption. Compliant with Kenya's Data Protection Act 2019. 
            Your data is stored securely and never shared with third parties.
          </span>
        </p>
      </div>
    </div>
  );
}