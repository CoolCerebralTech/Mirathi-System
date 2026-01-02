import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { User as UserIcon, AlertCircle } from 'lucide-react';

import { UpdateMyUserRequestSchema, type UpdateMyUserInput } from '../../../types';
import { useUpdateCurrentUser, useCurrentUser } from '../../user/user.api'; // Adjust path as needed

import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../../../components/ui/Card';

/**
 * A form for updating the user's first and last name.
 */
export function UpdateNameForm() {
  const { t } = useTranslation(['user', 'validation', 'common']);
  const { data: currentUser } = useCurrentUser();
  const { mutate: updateUser, isPending } = useUpdateCurrentUser();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isValid },
  } = useForm<UpdateMyUserInput>({
    resolver: zodResolver(UpdateMyUserRequestSchema),
    mode: 'onTouched',
    values: { // Pre-fill the form with current user data
      firstName: currentUser?.firstName || '',
      lastName: currentUser?.lastName || '',
    },
  });

  const onSubmit = (formData: UpdateMyUserInput) => {
    updateUser(formData, {
      onSuccess: (data) => {
        // Reset the form with the new data to clear the 'dirty' state
        reset(data.user);
      },
    });
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>{t('user:update_name_title', 'Full Name')}</CardTitle>
        <CardDescription>{t('user:update_name_description', 'Update your first and last name.')}</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <CardContent className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* First Name */}
          <div className="space-y-2">
            <Label htmlFor="firstName">{t('user:first_name', 'First Name')}</Label>
            <div className="relative">
              <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <Input
                id="firstName"
                type="text"
                autoComplete="given-name"
                disabled={isPending}
                className="pl-10"
                {...register('firstName')}
              />
            </div>
            {errors.firstName && <p className="text-sm text-danger flex items-center gap-1.5"><AlertCircle size={14} />{errors.firstName.message}</p>}
          </div>

          {/* Last Name */}
          <div className="space-y-2">
            <Label htmlFor="lastName">{t('user:last_name', 'Last Name')}</Label>
            <div className="relative">
              <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <Input
                id="lastName"
                type="text"
                autoComplete="family-name"
                disabled={isPending}
                className="pl-10"
                {...register('lastName')}
              />
            </div>
            {errors.lastName && <p className="text-sm text-danger flex items-center gap-1.5"><AlertCircle size={14} />{errors.lastName.message}</p>}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end bg-neutral-50 p-4">
          <Button type="submit" isLoading={isPending} disabled={!isDirty || !isValid || isPending}>
            {t('common:save_changes', 'Save Changes')}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}