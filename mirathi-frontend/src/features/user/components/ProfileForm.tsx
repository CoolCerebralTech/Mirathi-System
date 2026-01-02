import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { MapPin, Users, AlertCircle, Briefcase } from 'lucide-react';

import { UpdateMyProfileRequestSchema, type UpdateMyProfileInput } from '../../../types';
import { useCurrentProfile, useUpdateCurrentProfile } from '../user.api';

import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import { Textarea } from '../../../components/ui/Textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../../../components/ui/Card';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import { Alert, AlertDescription, AlertTitle } from '../../../components/ui/Alert';

// ============================================================================
// SUB-COMPONENTS
// ============================================================================
const FormSection = ({ icon, title, description, children }: { icon: React.ReactNode; title: string; description?: string; children: React.ReactNode }) => (
  <div className="space-y-4 pt-6 first:pt-0">
    <div className="flex items-start gap-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">{icon}</div>
      <div>
        <h3 className="text-lg font-semibold text-text">{title}</h3>
        {description && <p className="text-sm text-text-muted">{description}</p>}
      </div>
    </div>
    <div className="pl-14 space-y-4">{children}</div>
  </div>
);

const CharacterCounter = ({ current, max }: { current: number; max: number }) => {
  const isAtLimit = current >= max;
  return <div className={`text-right text-xs ${isAtLimit ? 'text-danger' : 'text-text-muted'}`}>{current} / {max}</div>;
};

const LoadingState = () => {
  const { t } = useTranslation(['user']);
  return (
    <Card className="shadow-lg"><CardContent className="flex flex-col items-center justify-center py-24 space-y-4">
      <LoadingSpinner size="lg" /><p className="text-text-muted">{t('user:loading_profile', 'Loading Profile...')}</p>
    </CardContent></Card>
  );
};

// ============================================================================
// MAIN PROFILE FORM
// ============================================================================
export function ProfileForm() {
  const { t } = useTranslation(['user', 'validation', 'common']);
  const { data: profile, isLoading: isLoadingProfile } = useCurrentProfile();
  const { mutate: updateProfile, isPending } = useUpdateCurrentProfile();

  const defaultValues: UpdateMyProfileInput = {
    bio: profile?.bio ?? '',
    phoneNumber: profile?.phoneNumber ?? '',
    address: profile?.address ?? { street: '', city: '', county: '', postalCode: '', country: 'Kenya' },
    nextOfKin: profile?.nextOfKin ?? { fullName: '', relationship: 'OTHER', phoneNumber: '' },
  };

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty, isValid },
  } = useForm<UpdateMyProfileInput>({
    resolver: zodResolver(UpdateMyProfileRequestSchema),
    mode: 'onTouched',
    values: {
      bio: profile?.bio ?? '',
      phoneNumber: profile?.phoneNumber ?? '',
      // This now provides the default 'Kenya' value, satisfying the stricter schema
      address: profile?.address ?? { street: '', city: '', county: '', postalCode: '', country: 'Kenya' },
      nextOfKin: profile?.nextOfKin ?? { fullName: '', relationship: 'OTHER', phoneNumber: '' },
    },
  });

  const watchedBio = watch('bio', '');

  const onSubmit = (formData: UpdateMyProfileInput) => {
    updateProfile(formData, {
      onSuccess: (data) => {
        // The optimistic update is handled by the hook.
        // We just need to reset the form's state to match the new server state.
        reset(data.profile);
      },
    });
  };

  if (isLoadingProfile) return <LoadingState />;

  if (!profile) {
    return (
      <Card className="shadow-lg"><CardContent className="py-16"><Alert variant="destructive">
        <AlertCircle className="h-4 w-4" /><AlertTitle>{t('user:profile_not_found', 'Profile Not Found')}</AlertTitle>
        <AlertDescription>{t('user:profile_not_found_description', 'We could not load your profile data.')}</AlertDescription>
      </Alert></CardContent></Card>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold">{t('user:profile_information', 'Profile Information')}</CardTitle>
          <CardDescription>{t('user:profile_information_prompt', 'Keep your personal details up-to-date.')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 divide-y divide-neutral-200">
          <FormSection icon={<Briefcase />} title={t('user:personal_information')}>
            <div className="space-y-2">
              <Label htmlFor="bio">{t('user:bio', 'Biography')}</Label>
              <Textarea id="bio" rows={4} disabled={isPending} {...register('bio')} />
              {/* --- FIX: Safely access length --- */}
              <CharacterCounter current={(watchedBio ?? '').length} max={500} />
              {errors.bio && <p className="text-sm text-danger">{errors.bio.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">{t('user:phone_number', 'Phone Number')}</Label>
              <Input id="phoneNumber" type="tel" disabled={isPending} {...register('phoneNumber')} />
              {errors.phoneNumber && <p className="text-sm text-danger">{errors.phoneNumber.message}</p>}
            </div>
          </FormSection>

          <FormSection icon={<MapPin className="h-5 w-5 text-primary" />} title={t('user:address', 'Residential Address')}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2"><Label htmlFor="address.street">{t('user:street', 'Street Address')}</Label><Input id="address.street" disabled={isPending} {...register('address.street')} />{errors.address?.street && <p className="text-sm text-danger">{errors.address.street.message}</p>}</div>
              <div className="space-y-2"><Label htmlFor="address.city">{t('user:city', 'City')}</Label><Input id="address.city" disabled={isPending} {...register('address.city')} />{errors.address?.city && <p className="text-sm text-danger">{errors.address.city.message}</p>}</div>
              <div className="space-y-2"><Label htmlFor="address.postalCode">{t('user:postalCode', 'Postal Code')}</Label><Input id="address.postalCode" disabled={isPending} {...register('address.postalCode')} />{errors.address?.postalCode && <p className="text-sm text-danger">{errors.address.postalCode.message}</p>}</div>
            </div>
          </FormSection>

          <FormSection icon={<Users className="h-5 w-5 text-primary" />} title={t('user:next_of_kin', 'Next of Kin')}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2"><Label htmlFor="nextOfKin.fullName">{t('user:fullName', 'Full Name')}</Label><Input id="nextOfKin.fullName" disabled={isPending} {...register('nextOfKin.fullName')} />{errors.nextOfKin?.fullName && <p className="text-sm text-danger">{errors.nextOfKin.fullName.message}</p>}</div>
              <div className="space-y-2"><Label htmlFor="nextOfKin.relationship">{t('user:relationship', 'Relationship')}</Label><Input id="nextOfKin.relationship" disabled={isPending} {...register('nextOfKin.relationship')} />{errors.nextOfKin?.relationship && <p className="text-sm text-danger">{errors.nextOfKin.relationship.message}</p>}</div>
              <div className="space-y-2"><Label htmlFor="nextOfKin.phoneNumber">{t('user:phone_number', 'Phone Number')}</Label><Input id="nextOfKin.phoneNumber" type="tel" disabled={isPending} {...register('nextOfKin.phoneNumber')} />{errors.nextOfKin?.phoneNumber && <p className="text-sm text-danger">{errors.nextOfKin.phoneNumber.message}</p>}</div>
            </div>
          </FormSection>
        </CardContent>
        <CardFooter className="flex justify-end gap-3 bg-neutral-50 p-4 border-t">
          <Button type="button" variant="outline" onClick={() => reset(defaultValues)} disabled={!isDirty || isPending}>
            {t('common:cancel', 'Cancel')}
          </Button>
          <Button type="submit" isLoading={isPending} disabled={!isDirty || !isValid || isPending}>
            {t('common:save_changes', 'Save Changes')}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}