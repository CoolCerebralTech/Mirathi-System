import { useState } from 'react';
import { useForm, type UseFormRegister } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Lock, Eye, EyeOff, AlertCircle, ShieldCheck, KeyRound } from 'lucide-react';

import { ChangePasswordRequestSchema, type ChangePasswordInput } from '../../../types';
import { useChangePassword, useLogout } from '../../auth/auth.api';

import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import { Checkbox } from '../../../components/ui/Checkbox';
import { PasswordRequirements } from '../../../components/auth/PasswordRequirements';

// --- Sub-component: Toggleable Password Input ---
interface PasswordInputWithToggleProps {
  id: keyof ChangePasswordInput;
  label: string;
  autoComplete: string;
  disabled?: boolean;
  register: UseFormRegister<ChangePasswordInput>;
  error?: string;
  onFocus?: () => void;
}

function PasswordInputWithToggle({ id, label, autoComplete, disabled, register, error, onFocus }: PasswordInputWithToggleProps) {
  const [showPassword, setShowPassword] = useState(false);
  
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-semibold text-slate-700">{label}</Label>
      <div className="relative">
        <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          id={id}
          type={showPassword ? 'text' : 'password'}
          autoComplete={autoComplete}
          disabled={disabled}
          onFocus={onFocus}
          className={`pl-10 pr-10 h-11 border-slate-300 focus:border-[#0F3D3E] focus:ring-[#0F3D3E]/20 ${error ? 'border-red-300 focus:border-red-500' : ''}`}
          {...register(id)}
        />
        <button 
          type="button" 
          onClick={() => setShowPassword(!showPassword)} 
          disabled={disabled} 
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 focus:outline-none rounded"
        >
          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {error && <p className="text-xs font-medium text-red-600 flex items-center gap-1.5 mt-1"><AlertCircle size={12} />{error}</p>}
    </div>
  );
}

// --- Main Form ---
export function ChangePasswordForm() {
  useTranslation(['auth', 'common']);
  const { mutate: changePassword, isPending } = useChangePassword();
  const { mutate: logout } = useLogout();
  const [showRequirements, setShowRequirements] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(ChangePasswordRequestSchema),
    mode: 'onTouched',
    defaultValues: {
      currentPassword: '',
      password: '',
      passwordConfirmation: '',
      terminateOtherSessions: true,
    },
  });

  const watchedPassword = watch('password', '');
  const terminateSessions = watch('terminateOtherSessions');

  const onSubmit = (formData: ChangePasswordInput) => {
    changePassword(formData, {
      onSuccess: () => {
        reset();
        setShowRequirements(false);
        if (formData.terminateOtherSessions) logout(undefined);
      },
      onError: (err) => console.error(err),
    });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-start gap-4">
        <div className="p-2 bg-emerald-100/50 rounded-lg text-[#0F3D3E]">
          <KeyRound className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900">Password & Security</h3>
          <p className="text-sm text-slate-500">Manage your credentials and session security.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-6 space-y-6">
        
        {/* Security Tip */}
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3">
          <ShieldCheck className="h-5 w-5 text-blue-600 shrink-0" />
          <div>
            <h4 className="text-sm font-semibold text-blue-900">Institutional Security Standard</h4>
            <p className="text-xs text-blue-700 mt-0.5 leading-relaxed">
              We recommend rotating your password every 90 days. Use a unique combination not used on other platforms.
            </p>
          </div>
        </div>

        <div className="space-y-4 max-w-lg">
          <PasswordInputWithToggle
            id="currentPassword"
            label="Current Password"
            autoComplete="current-password"
            disabled={isPending}
            register={register}
            error={errors.currentPassword?.message}
          />

          <hr className="border-slate-100 my-4" />

          <PasswordInputWithToggle
            id="password"
            label="New Password"
            autoComplete="new-password"
            disabled={isPending}
            register={register}
            error={errors.password?.message}
            onFocus={() => setShowRequirements(true)}
          />

          {/* Inline Requirements Panel */}
          <div className={`transition-all duration-300 overflow-hidden ${showRequirements || watchedPassword ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'}`}>
             <PasswordRequirements password={watchedPassword} show={true} />
          </div>

          <PasswordInputWithToggle
            id="passwordConfirmation"
            label="Confirm New Password"
            autoComplete="new-password"
            disabled={isPending}
            register={register}
            error={errors.passwordConfirmation?.message}
          />
        </div>

        {/* Session Termination Option */}
        <div className="flex items-start space-x-3 p-4 bg-slate-50 border border-slate-200 rounded-lg">
          <Checkbox 
            id="terminateOtherSessions" 
            className="mt-0.5 border-slate-400 data-[state=checked]:bg-[#0F3D3E] data-[state=checked]:border-[#0F3D3E]"
            disabled={isPending} 
            checked={terminateSessions} 
            onCheckedChange={(c) => register('terminateOtherSessions').onChange({ target: { value: c } })} 
          />
          <div className="grid gap-1">
            <Label htmlFor="terminateOtherSessions" className="text-sm font-semibold text-slate-900 cursor-pointer">
              Sign out of all other devices
            </Label>
            <p className="text-xs text-slate-500">
              Recommended if you suspect unauthorized access. You will remain logged in on this device.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={() => reset()} disabled={!isDirty || isPending} className="border-slate-300 text-slate-700">
            Cancel
          </Button>
          <Button type="submit" isLoading={isPending} disabled={isPending || !isDirty} className="bg-[#0F3D3E] hover:bg-[#0F3D3E]/90 text-white min-w-[140px]">
            Update Password
          </Button>
        </div>
      </form>
    </div>
  );
}