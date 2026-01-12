import { useState, useEffect, useRef } from 'react';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Mail, 
  Lock, 
  User, 
  ShieldCheck, 
  CheckCircle2, 
  Info,
  Eye,
  EyeOff,
  ArrowRight
} from 'lucide-react';

import {
  RegisterRequestSchema,
  type RegisterInput,
} from '@/types/auth.types';
import { useRegister } from '@/api/auth/auth.api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Checkbox } from '@/components/ui/Checkbox';

// --- Internal Components ---

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
    <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-4 animate-in fade-in slide-in-from-top-2">
      <div className="flex items-center gap-2 mb-3">
        <Info size={14} className="text-slate-500" />
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Security Requirements
        </span>
      </div>
      <ul className="space-y-2">
        {requirements.map((req, index) => (
          <li
            key={index}
            className={`flex items-center gap-2 text-xs transition-colors duration-200 ${
              req.met ? 'text-emerald-700 font-medium' : 'text-slate-500'
            }`}
          >
            {req.met ? (
              <CheckCircle2 size={14} className="flex-shrink-0 text-emerald-600" />
            ) : (
              <div className="h-3.5 w-3.5 rounded-full border border-slate-300 flex-shrink-0" />
            )}
            <span>{req.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function RegisterForm() {
  const navigate = useNavigate();
  const { mutate: registerUser, isPending } = useRegister();
  
  // State for password visibility and requirements panel
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showRequirements, setShowRequirements] = useState(false);

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
      
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-slate-50 text-emerald-700 border border-slate-100 shadow-sm mb-6">
          <ShieldCheck className="h-7 w-7" />
        </div>
        
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight sm:text-3xl">
          Create Your Account
        </h1>
        
        <p className="mt-3 text-base text-slate-500 leading-relaxed">
          Secure your family legacy with Mirathi
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        
        {/* Names Row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName" className="text-sm font-semibold text-slate-700">
              First Name
            </Label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <Input
                id="firstName"
                placeholder="John"
                autoComplete="given-name"
                disabled={isPending}
                className="pl-10 h-11 border-slate-300 focus:border-emerald-500 focus:ring-emerald-500/20"
                error={errors.firstName?.message}
                {...register('firstName')}
              />
            </div>
            {errors.firstName?.message && (
              <p className="text-xs text-red-600 mt-1 font-medium">{errors.firstName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName" className="text-sm font-semibold text-slate-700">
              Last Name
            </Label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <Input
                id="lastName"
                placeholder="Kamau"
                autoComplete="family-name"
                disabled={isPending}
                className="pl-10 h-11 border-slate-300 focus:border-emerald-500 focus:ring-emerald-500/20"
                error={errors.lastName?.message}
                {...register('lastName')}
              />
            </div>
            {errors.lastName?.message && (
              <p className="text-xs text-red-600 mt-1 font-medium">{errors.lastName.message}</p>
            )}
          </div>
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-semibold text-slate-700">
            Email Address
          </Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              autoComplete="email"
              disabled={isPending}
              className="pl-10 h-11 border-slate-300 focus:border-emerald-500 focus:ring-emerald-500/20"
              error={errors.email?.message}
              {...register('email')}
            />
          </div>
          {errors.email?.message && (
            <p className="text-sm text-red-600 mt-1 font-medium">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-semibold text-slate-700">
            Password
          </Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="new-password"
              disabled={isPending}
              onFocus={() => setShowRequirements(true)}
              className="pl-10 pr-11 h-11 border-slate-300 focus:border-emerald-500 focus:ring-emerald-500/20"
              error={errors.password?.message}
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 focus:outline-none"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          
          <PasswordRequirements 
            password={watchedPassword} 
            show={showRequirements || (watchedPassword.length > 0)} 
          />
          
          {errors.password?.message && (
            <p className="text-sm text-red-600 mt-1 font-medium">{errors.password.message}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-2">
          <Label htmlFor="passwordConfirmation" className="text-sm font-semibold text-slate-700">
            Confirm Password
          </Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <Input
              id="passwordConfirmation"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="new-password"
              disabled={isPending}
              className="pl-10 pr-11 h-11 border-slate-300 focus:border-emerald-500 focus:ring-emerald-500/20"
              error={errors.passwordConfirmation?.message}
              {...register('passwordConfirmation')}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 focus:outline-none"
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.passwordConfirmation?.message && (
            <p className="text-sm text-red-600 mt-1 font-medium">{errors.passwordConfirmation.message}</p>
          )}
        </div>

        {/* Consents */}
        <div className="space-y-5 pt-4 border-t border-slate-100 mt-6">
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
                  className="mt-1 h-5 w-5 border-slate-300 data-[state=checked]:bg-slate-900"
                />
              )}
            />
            <Label htmlFor="acceptedTerms" className="text-sm text-slate-600 cursor-pointer leading-relaxed">
              I agree to the{' '}
              <Link to="/legal/terms" className="text-emerald-700 hover:underline font-medium" target="_blank" rel="noopener noreferrer">
                Terms of Service
              </Link>
              {' '}and{' '}
              <Link to="/legal/privacy" className="text-emerald-700 hover:underline font-medium" target="_blank" rel="noopener noreferrer">
                Privacy Policy
              </Link>
              <span className="text-red-600 ml-1" aria-hidden="true">*</span>
            </Label>
          </div>
          {errors.acceptedTerms?.message && (
            <p className="text-sm text-red-600 -mt-2 ml-8">{errors.acceptedTerms.message}</p>
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
                  className="mt-1 h-5 w-5 border-slate-300 data-[state=checked]:bg-slate-900"
                />
              )}
            />
            <Label htmlFor="marketingOptIn" className="text-sm text-slate-600 cursor-pointer leading-relaxed">
              Send me relevant updates about succession law and feature improvements (optional)
            </Label>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          size="lg"
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold h-12 rounded-lg mt-6 shadow-sm"
          disabled={isPending}
          isLoading={isPending}
        >
          {isPending ? (
             'Creating Account...'
          ) : (
            <span className="flex items-center gap-2">
              Create Account 
              <ArrowRight size={18} className="opacity-80" />
            </span>
          )}
        </Button>
      </form>

      {/* Footer / Login Link */}
      <div className="mt-8 space-y-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-4 text-slate-500 font-medium">
              Already have an account?
            </span>
          </div>
        </div>

        <div className="text-center">
          <Link
            to="/login"
            className="inline-flex items-center justify-center w-full px-4 py-3 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-all focus:outline-none focus:ring-2 focus:ring-slate-200"
          >
            Sign In
          </Link>
        </div>
      </div>

      {/* Security Footnote */}
      <div className="mt-10 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-100">
          <Lock size={12} className="text-emerald-600" />
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
            Secure Registration
          </span>
        </div>
      </div>
    </div>
  );
}