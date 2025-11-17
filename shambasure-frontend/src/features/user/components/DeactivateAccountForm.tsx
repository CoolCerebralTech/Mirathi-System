import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { AlertCircle, ShieldAlert } from 'lucide-react';

import { DeactivateMyAccountRequestSchema, type DeactivateMyAccountInput } from '../../../types';
import { useDeactivateAccount } from '../../user/user.api';

import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../../../components/ui/Card';
import { Alert, AlertDescription, AlertTitle } from '../../../components/ui/Alert';
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
} from '../../../components/ui/AlertDialog';

/**
 * A form for deactivating the user's account, with a confirmation step.
 */
export function DeactivateAccountForm() {
  const { t } = useTranslation(['user', 'validation', 'common']);
  const { mutate: deactivateAccount, isPending } = useDeactivateAccount();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<DeactivateMyAccountInput>({
    resolver: zodResolver(DeactivateMyAccountRequestSchema),
    mode: 'onTouched',
    defaultValues: {
      password: '',
      reason: '',
    },
  });

  const onSubmit = (formData: DeactivateMyAccountInput) => {
    deactivateAccount(formData);
    // The useDeactivateAccount hook will handle logging the user out on success.
  };

  return (
    <Card className="shadow-lg border-danger">
      <CardHeader>
        <CardTitle className="text-danger">{t('user:deactivate_title', 'Deactivate Account')}</CardTitle>
        <CardDescription>{t('user:deactivate_description', 'Permanently deactivate your account.')}</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <CardContent className="space-y-6">
          <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>{t('user:action_irreversible', 'This action is irreversible.')}</AlertTitle>
            <AlertDescription>
              {t('user:deactivate_warning', 'Deactivating your account will remove all your data. You will not be able to recover your account.')}
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="password">{t('user:confirm_password', 'Confirm with your password')}</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              disabled={isPending}
              {...register('password')}
            />
            {errors.password && <p className="text-sm text-danger flex items-center gap-1.5"><AlertCircle size={14} />{errors.password.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">{t('user:deactivation_reason', 'Reason for leaving (Optional)')}</Label>
            <Input
              id="reason"
              type="text"
              placeholder={t('user:deactivation_placeholder', 'e.g., Taking a break')}
              disabled={isPending}
              {...register('reason')}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end bg-danger/5 p-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={!isValid || isPending}>
                {t('user:deactivate_account_button', 'Deactivate Account')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('user:are_you_sure', 'Are you absolutely sure?')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('user:deactivate_final_warning', 'This action cannot be undone. This will permanently delete your account and remove your data from our servers.')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('common:cancel', 'Cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={handleSubmit(onSubmit)} disabled={isPending}>
                  {isPending ? t('user:deactivating', 'Deactivating...') : t('user:confirm_deactivation', 'Yes, Deactivate Account')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      </form>
    </Card>
  );
}