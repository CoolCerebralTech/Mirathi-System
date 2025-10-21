// ============================================================================
// ProfileForm.tsx - User Profile Update Form Component
// ============================================================================
// Production-ready profile form with optimistic updates, comprehensive
// validation, section organization, and enhanced user experience.
// ============================================================================

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  User,
  Phone,
  MapPin,
  Users,
  AlertCircle,
  Info,
  CheckCircle2,
  Mail,
  Briefcase,
} from 'lucide-react';

import {
  UpdateUserProfileSchema,
  type UpdateUserProfileInput,
} from '../../../types';
import { useProfile, useUpdateProfile } from '../user.api';
import { extractErrorMessage } from '../../../api/client';

import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import { Textarea } from '../../../components/ui/Textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '../../../components/ui/Card';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import { Alert, AlertDescription, AlertTitle } from '../../../components/ui/Alert';
import { Separator } from '../../../components/ui/Separator';

// ============================================================================
// FORM SECTION COMPONENT
// ============================================================================

interface FormSectionProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
}

function FormSection({ icon, title, description, children }: FormSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 flex-shrink-0">
          {icon}
        </div>
        <div className="space-y-1 flex-1">
          <h3 className="text-lg font-semibold">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      <div className="ml-[52px] space-y-4">{children}</div>
    </div>
  );
}

// ============================================================================
// CHARACTER COUNTER COMPONENT
// ============================================================================

interface CharacterCounterProps {
  current: number;
  max: number;
}

function CharacterCounter({ current, max }: CharacterCounterProps) {
  const percentage = (current / max) * 100;
  const isNearLimit = percentage >= 80;
  const isAtLimit = current >= max;

  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">Character count</span>
      <span
        className={`font-medium ${
          isAtLimit
            ? 'text-red-600'
            : isNearLimit
            ? 'text-orange-600'
            : 'text-muted-foreground'
        }`}
      >
        {current} / {max}
      </span>
    </div>
  );
}

// ============================================================================
// LOADING STATE COMPONENT
// ============================================================================

function LoadingState() {
  const { t } = useTranslation(['user']);
  
  return (
    <Card className="shadow-lg">
      <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-sm text-muted-foreground">
          {t('user:loading_profile')}
        </p>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN PROFILE FORM
// ============================================================================

/**
 * Profile update form for authenticated users.
 * 
 * FEATURES:
 * - Personal information (bio, phone)
 * - Address details (street, city, postcode, country)
 * - Next of kin information
 * - Optimistic updates (instant UI feedback)
 * - Character counter for bio
 * - Section organization with icons
 * - Form state management
 * - Cancel/reset functionality
 * 
 * DATA SYNC:
 * - Automatically syncs with fetched profile data
 * - Resets form when profile loads
 * - Tracks dirty state for save/cancel buttons
 * - Optimistic updates with rollback on error
 * 
 * UX:
 * - Visual section organization
 * - Helpful descriptions
 * - Character limits
 * - Loading states
 * - Success feedback
 * - Error handling
 */
export function ProfileForm() {
  const { t } = useTranslation(['user', 'validation', 'common']);
  const { data: user, isLoading: isLoadingProfile } = useProfile();
  const { mutate: updateProfile, isPending } = useUpdateProfile();

  const [bioLength, setBioLength] = useState(0);
  const maxBioLength = 500;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty, isValid },
  } = useForm<UpdateUserProfileInput>({
    resolver: zodResolver(UpdateUserProfileSchema),
    mode: 'onChange',
    defaultValues: {
      bio: '',
      phoneNumber: '',
      address: {
        street: '',
        city: '',
        postCode: '',
        country: '',
      },
      nextOfKin: {
        fullName: '',
        relationship: '',
        phoneNumber: '',
      },
    },
  });

  const watchedBio = watch('bio');

  // Update bio character count
  useEffect(() => {
    setBioLength(watchedBio?.length || 0);
  }, [watchedBio]);

  /**
   * Sync form with fetched profile data.
   * Updates form defaults when profile loads from API.
   */
  useEffect(() => {
    if (user?.profile) {
      reset({
        bio: user.profile.bio ?? '',
        phoneNumber: user.profile.phoneNumber ?? '',
        address: user.profile.address ?? {
          street: '',
          city: '',
          postCode: '',
          country: '',
        },
        nextOfKin: user.profile.nextOfKin ?? {
          fullName: '',
          relationship: '',
          phoneNumber: '',
        },
      });
    }
  }, [user, reset]);

  /**
   * Form submission handler.
   * Uses optimistic updates for instant feedback.
   */
  const onSubmit = (formData: UpdateUserProfileInput) => {
    updateProfile(formData, {
      onSuccess: () => {
        toast.success(t('user:profile_update_success'), {
          description: t('user:profile_update_success_description'),
          duration: 3000,
        });
      },
      onError: (error) => {
        const errorMessage = extractErrorMessage(error);
        toast.error(t('user:profile_update_failed'), {
          description: errorMessage,
          duration: 5000,
        });
      },
    });
  };

  /**
   * Cancel handler - resets form to last saved state
   */
  const handleCancel = () => {
    if (user?.profile) {
      reset({
        bio: user.profile.bio ?? '',
        phoneNumber: user.profile.phoneNumber ?? '',
        address: user.profile.address ?? {
          street: '',
          city: '',
          postCode: '',
          country: '',
        },
        nextOfKin: user.profile.nextOfKin ?? {
          fullName: '',
          relationship: '',
          phoneNumber: '',
        },
      });
    }
  };

  // Show loading state while fetching profile
  if (isLoadingProfile) {
    return <LoadingState />;
  }

  // Show message if no user data
  if (!user) {
    return (
      <Card className="shadow-lg">
        <CardContent className="py-16">
          <Alert variant="warning">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t('user:profile_not_found')}</AlertTitle>
            <AlertDescription>
              {t('user:profile_not_found_description')}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Card className="shadow-lg">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">
                {t('user:profile_information')}
              </CardTitle>
              <CardDescription>
                {t('user:profile_information_prompt')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Optimistic Update Notice */}
          {isDirty && (
            <Alert className="bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-xs">
                {t('user:unsaved_changes_notice')}
              </AlertDescription>
            </Alert>
          )}

          {/* User Email Display (Read-only) */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail size={14} />
              {t('user:email')}
            </Label>
            <Input
              id="email"
              type="email"
              value={user.email}
              disabled
              className="bg-muted cursor-not-allowed"
              aria-label={t('user:email_readonly')}
            />
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Info size={12} />
              {t('user:email_cannot_be_changed')}
            </p>
          </div>

          <Separator />

          {/* Personal Information Section */}
          <FormSection
            icon={<Briefcase className="h-5 w-5 text-primary" />}
            title={t('user:personal_information')}
            description={t('user:personal_information_description')}
          >
            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio">{t('user:bio')}</Label>
              <Textarea
                id="bio"
                rows={4}
                placeholder={t('user:bio_placeholder')}
                disabled={isPending}
                maxLength={maxBioLength}
                aria-invalid={!!errors.bio}
                aria-describedby={errors.bio ? 'bio-error' : 'bio-help'}
                {...register('bio')}
              />
              <CharacterCounter current={bioLength} max={maxBioLength} />
              {!errors.bio && (
                <p id="bio-help" className="text-xs text-muted-foreground">
                  {t('user:bio_help_text')}
                </p>
              )}
              {errors.bio && (
                <p
                  id="bio-error"
                  className="text-sm text-destructive flex items-center gap-1"
                  role="alert"
                >
                  <AlertCircle size={14} />
                  {errors.bio.message}
                </p>
              )}
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <Label htmlFor="phoneNumber" className="flex items-center gap-2">
                <Phone size={14} />
                {t('user:phone_number')}
              </Label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder={t('user:phone_number_placeholder')}
                disabled={isPending}
                aria-invalid={!!errors.phoneNumber}
                aria-describedby={errors.phoneNumber ? 'phoneNumber-error' : 'phoneNumber-help'}
                {...register('phoneNumber')}
              />
              {!errors.phoneNumber && (
                <p id="phoneNumber-help" className="text-xs text-muted-foreground">
                  {t('user:phone_number_help_text')}
                </p>
              )}
              {errors.phoneNumber && (
                <p
                  id="phoneNumber-error"
                  className="text-sm text-destructive flex items-center gap-1"
                  role="alert"
                >
                  <AlertCircle size={14} />
                  {errors.phoneNumber.message}
                </p>
              )}
            </div>
          </FormSection>

          <Separator />

          {/* Address Section */}
          <FormSection
            icon={<MapPin className="h-5 w-5 text-primary" />}
            title={t('user:address')}
            description={t('user:address_description')}
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Street */}
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address.street">{t('user:street')}</Label>
                <Input
                  id="address.street"
                  placeholder={t('user:street_placeholder')}
                  disabled={isPending}
                  aria-invalid={!!errors.address?.street}
                  {...register('address.street')}
                />
                {errors.address?.street && (
                  <p className="text-sm text-destructive flex items-center gap-1" role="alert">
                    <AlertCircle size={14} />
                    {errors.address.street.message}
                  </p>
                )}
              </div>

              {/* City */}
              <div className="space-y-2">
                <Label htmlFor="address.city">{t('user:city')}</Label>
                <Input
                  id="address.city"
                  placeholder={t('user:city_placeholder')}
                  disabled={isPending}
                  aria-invalid={!!errors.address?.city}
                  {...register('address.city')}
                />
                {errors.address?.city && (
                  <p className="text-sm text-destructive flex items-center gap-1" role="alert">
                    <AlertCircle size={14} />
                    {errors.address.city.message}
                  </p>
                )}
              </div>

              {/* Post Code */}
              <div className="space-y-2">
                <Label htmlFor="address.postCode">{t('user:postCode')}</Label>
                <Input
                  id="address.postCode"
                  placeholder={t('user:postCode_placeholder')}
                  disabled={isPending}
                  aria-invalid={!!errors.address?.postCode}
                  {...register('address.postCode')}
                />
                {errors.address?.postCode && (
                  <p className="text-sm text-destructive flex items-center gap-1" role="alert">
                    <AlertCircle size={14} />
                    {errors.address.postCode.message}
                  </p>
                )}
              </div>

              {/* Country */}
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address.country">{t('user:country')}</Label>
                <Input
                  id="address.country"
                  placeholder={t('user:country_placeholder')}
                  disabled={isPending}
                  aria-invalid={!!errors.address?.country}
                  {...register('address.country')}
                />
                {errors.address?.country && (
                  <p className="text-sm text-destructive flex items-center gap-1" role="alert">
                    <AlertCircle size={14} />
                    {errors.address.country.message}
                  </p>
                )}
              </div>
            </div>
          </FormSection>

          <Separator />

          {/* Next of Kin Section */}
          <FormSection
            icon={<Users className="h-5 w-5 text-primary" />}
            title={t('user:next_of_kin')}
            description={t('user:next_of_kin_description')}
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Full Name */}
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="nextOfKin.fullName">{t('user:fullName')}</Label>
                <Input
                  id="nextOfKin.fullName"
                  placeholder={t('user:fullName_placeholder')}
                  disabled={isPending}
                  aria-invalid={!!errors.nextOfKin?.fullName}
                  {...register('nextOfKin.fullName')}
                />
                {errors.nextOfKin?.fullName && (
                  <p className="text-sm text-destructive flex items-center gap-1" role="alert">
                    <AlertCircle size={14} />
                    {errors.nextOfKin.fullName.message}
                  </p>
                )}
              </div>

              {/* Relationship */}
              <div className="space-y-2">
                <Label htmlFor="nextOfKin.relationship">{t('user:relationship')}</Label>
                <Input
                  id="nextOfKin.relationship"
                  placeholder={t('user:relationship_placeholder')}
                  disabled={isPending}
                  aria-invalid={!!errors.nextOfKin?.relationship}
                  {...register('nextOfKin.relationship')}
                />
                {errors.nextOfKin?.relationship && (
                  <p className="text-sm text-destructive flex items-center gap-1" role="alert">
                    <AlertCircle size={14} />
                    {errors.nextOfKin.relationship.message}
                  </p>
                )}
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <Label htmlFor="nextOfKin.phoneNumber" className="flex items-center gap-2">
                  <Phone size={14} />
                  {t('user:phone_number')}
                </Label>
                <Input
                  id="nextOfKin.phoneNumber"
                  type="tel"
                  placeholder={t('user:phone_number_placeholder')}
                  disabled={isPending}
                  aria-invalid={!!errors.nextOfKin?.phoneNumber}
                  {...register('nextOfKin.phoneNumber')}
                />
                {errors.nextOfKin?.phoneNumber && (
                  <p className="text-sm text-destructive flex items-center gap-1" role="alert">
                    <AlertCircle size={14} />
                    {errors.nextOfKin.phoneNumber.message}
                  </p>
                )}
              </div>
            </div>
          </FormSection>
        </CardContent>

        <CardFooter className="flex justify-between gap-3 bg-muted/50 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {isDirty && (
              <>
                <AlertCircle size={14} />
                <span>{t('user:unsaved_changes')}</span>
              </>
            )}
            {!isDirty && isPending === false && (
              <>
                <CheckCircle2 size={14} className="text-green-600" />
                <span className="text-green-600">{t('user:all_changes_saved')}</span>
              </>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={!isDirty || isPending}
              className="min-w-[100px]"
            >
              {t('common:cancel')}
            </Button>
            <Button
              type="submit"
              isLoading={isPending}
              disabled={!isDirty || !isValid || isPending}
              className="min-w-[120px]"
            >
              {isPending ? t('common:saving') : t('common:save_changes')}
            </Button>
          </div>
        </CardFooter>
       </Card>  
      </form>
  );
}
