import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { AlertCircle, ShieldAlert, AlertTriangle } from 'lucide-react';

import { DeactivateMyAccountRequestSchema, type DeactivateMyAccountInput } from '@/types/user.types';
import { useDeactivateAccount } from '@/api/user/user.api';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/AlertDialog';

export function DeactivateAccountForm() {
  const { t } = useTranslation(['user', 'common']);
  const { mutate: deactivateAccount, isPending } = useDeactivateAccount();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<DeactivateMyAccountInput>({
    resolver: zodResolver(DeactivateMyAccountRequestSchema),
    mode: 'onTouched',
    defaultValues: { password: '', reason: '' },
  });

  const onSubmit = (formData: DeactivateMyAccountInput) => deactivateAccount(formData);

  return (
    <div className="bg-white rounded-xl border border-red-100 overflow-hidden shadow-sm">
      
      {/* Header - Danger Zone */}
      <div className="px-6 py-5 border-b border-red-100 bg-red-50/30 flex items-start gap-4">
        <div className="p-2 bg-red-100 rounded-lg text-red-700">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-red-900">Deactivate Account</h3>
          <p className="text-sm text-red-700/80">Permanent removal of access and data.</p>
        </div>
      </div>

      <form className="px-6 py-6 space-y-6">
        
        {/* Warning Banner */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
          <ShieldAlert className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-red-900">This action is irreversible</h4>
            <p className="text-xs text-red-800 mt-1 leading-relaxed">
              Deactivating your account will permanently delete your estate records, family tree data, and uploaded documents. 
              This data cannot be recovered by our support team.
            </p>
          </div>
        </div>

        <div className="space-y-4 max-w-lg">
          <div className="space-y-1.5">
            <Label htmlFor="deactivate-password">{t('user:confirm_password', 'Confirm Password')}</Label>
            <Input
              id="deactivate-password"
              type="password"
              autoComplete="current-password"
              disabled={isPending}
              placeholder="Enter your password to confirm"
              className="h-11 border-red-200 focus:border-red-500 focus:ring-red-500/20"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-xs font-medium text-red-600 flex items-center gap-1.5 mt-1">
                <AlertCircle size={12} /> {errors.password.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reason">Reason (Optional)</Label>
            <Input
              id="reason"
              placeholder="Why are you leaving?"
              disabled={isPending}
              className="h-11 border-slate-300"
              {...register('reason')}
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end pt-4 border-t border-slate-100">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={!isValid || isPending} className="bg-red-600 hover:bg-red-700 text-white font-semibold">
                Deactivate Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="text-red-600">Final Confirmation</AlertDialogTitle>
                <AlertDialogDescription className="text-slate-600">
                  Are you absolutely sure? This will permanently delete your account and remove your data from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleSubmit(onSubmit)} 
                  disabled={isPending}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {isPending ? 'Deactivating...' : 'Yes, Delete Everything'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </form>
    </div>
  );
}