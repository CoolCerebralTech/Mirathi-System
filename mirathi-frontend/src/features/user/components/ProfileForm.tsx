import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { MapPin, Phone, User } from 'lucide-react';

import { 
  UpdateMyProfileRequestSchema, 
  type UpdateMyProfileInput,
  UpdateMyUserRequestSchema,
  type UpdateMyUserInput
} from '../../../types';
import { useCurrentProfile, useUpdateCurrentProfile, useCurrentUser, useUpdateCurrentUser } from '../user.api';

import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../../../components/ui/Card';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import { Alert, AlertDescription } from '../../../components/ui/Alert';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

// ============================================================================
// SUB-COMPONENTS
// ============================================================================
const FormSection = ({ 
  icon, 
  title, 
  description, 
  children 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description?: string; 
  children: React.ReactNode 
}) => (
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

const LoadingState = () => {
  const { t } = useTranslation(['user']);
  return (
    <Card className="shadow-lg">
      <CardContent className="flex flex-col items-center justify-center py-24 space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-text-muted">{t('user:loading_profile', 'Loading Profile...')}</p>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// MAIN PROFILE FORM
// ============================================================================
export function ProfileForm() {
  const { t } = useTranslation(['user', 'validation', 'common']);
  
  // User data
  const { data: user, isLoading: isLoadingUser } = useCurrentUser();
  const { mutate: updateUser, isPending: isUpdatingUser } = useUpdateCurrentUser();
  
  // Profile data
  const { data: profile, isLoading: isLoadingProfile } = useCurrentProfile();
  const { mutate: updateProfile, isPending: isUpdatingProfile } = useUpdateCurrentProfile();

  const [activeSection, setActiveSection] = useState<'personal' | 'contact'>('personal');
  const [, setUpdateCount] = useState(0);

  // Initialize form with user and profile data or defaults
  const defaultUserValues: UpdateMyUserInput = {
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
  };

  const defaultProfileValues: UpdateMyProfileInput = {
    phoneNumber: profile?.phoneNumber ?? '',
    address: profile?.address ?? { 
      street: '', 
      city: '', 
      county: '', 
      postalCode: '', 
      country: '' 
    },
  };

  const {
    register: registerUser,
    handleSubmit: handleSubmitUser,
    reset: resetUser,
    formState: { errors: userErrors, isDirty: isUserDirty, isValid: isUserValid },
  } = useForm<UpdateMyUserInput>({
    resolver: zodResolver(UpdateMyUserRequestSchema),
    mode: 'onTouched',
    defaultValues: defaultUserValues,
  });

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    reset: resetProfile,
    formState: { errors: profileErrors, isDirty: isProfileDirty, isValid: isProfileValid },
  } = useForm<UpdateMyProfileInput>({
    resolver: zodResolver(UpdateMyProfileRequestSchema),
    mode: 'onTouched',
    defaultValues: defaultProfileValues,
  });

  // Reset forms when data loads
  useEffect(() => {
    if (user) {
      resetUser({
        firstName: user.firstName,
        lastName: user.lastName,
      });
    }
  }, [user, resetUser]);

  useEffect(() => {
    if (profile) {
      resetProfile({
        phoneNumber: profile.phoneNumber ?? '',
        address: profile.address ?? {
          street: '',
          city: '',
          county: '',
          postalCode: '',
          country: '',
        },
      });
    }
  }, [profile, resetProfile]);

  const onSubmitUser = (formData: UpdateMyUserInput) => {
    updateUser(formData, {
      onSuccess: () => {
        setUpdateCount(prev => prev + 1);
        toast.success(t('user:name_updated', 'Name updated successfully'));
      },
      onError: () => {
        toast.error(t('user:name_update_failed', 'Failed to update name'));
      },
    });
  };

  const onSubmitProfile = (formData: UpdateMyProfileInput) => {
    // Ensure country is filled (default to Kenya if empty)
    const processedData = {
      ...formData,
      address: {
        ...formData.address,
        country: formData.address?.country || 'Kenya',
      },
    };

    updateProfile(processedData, {
      onSuccess: () => {
        setUpdateCount(prev => prev + 1);
        toast.success(t('user:contact_updated', 'Contact information updated successfully'));
      },
      onError: () => {
        toast.error(t('user:contact_update_failed', 'Failed to update contact information'));
      },
    });
  };

  const handleSaveAll = () => {
    if (isUserDirty) {
      handleSubmitUser(onSubmitUser)();
    }
    if (isProfileDirty) {
      handleSubmitProfile(onSubmitProfile)();
    }
  };

  const handleDiscardAll = () => {
    resetUser();
    resetProfile();
  };

  const isLoading = isLoadingUser || isLoadingProfile;
  const isPending = isUpdatingUser || isUpdatingProfile;
  const isAnyDirty = isUserDirty || isProfileDirty;
  const isAllValid = (!isUserDirty || isUserValid) && (!isProfileDirty || isProfileValid);

  if (isLoading) return <LoadingState />;

  if (!user || !profile) {
    return (
      <Card className="shadow-lg">
        <CardContent className="py-16">
          <Alert variant="destructive">
            <AlertDescription>
              {t('user:profile_not_found_description', 'We could not load your profile data.')}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="flex border-b border-neutral-200">
        <button
          type="button"
          onClick={() => setActiveSection('personal')}
          className={`px-4 py-2 font-medium text-sm ${activeSection === 'personal' 
            ? 'border-b-2 border-primary text-primary' 
            : 'text-text-muted hover:text-text'}`}
        >
          {t('user:personal_info', 'Personal Information')}
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('contact')}
          className={`px-4 py-2 font-medium text-sm ${activeSection === 'contact' 
            ? 'border-b-2 border-primary text-primary' 
            : 'text-text-muted hover:text-text'}`}
        >
          {t('user:contact_info', 'Contact Information')}
        </button>
      </div>

      {/* Personal Information Form */}
      {activeSection === 'personal' && (
        <form onSubmit={handleSubmitUser(onSubmitUser)} noValidate>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-bold">
                {t('user:personal_information', 'Personal Information')}
              </CardTitle>
              <CardDescription>
                {t('user:personal_info_description', 'Your name as it appears on your account.')}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <FormSection 
                icon={<User className="h-5 w-5 text-primary" />} 
                title={t('user:name_details', 'Name Details')}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" required>
                      {t('user:first_name', 'First Name')}
                    </Label>
                    <Input 
                      id="firstName" 
                      disabled={isPending}
                      placeholder="John"
                      {...registerUser('firstName')}
                      className={userErrors.firstName ? 'border-danger' : ''}
                    />
                    {userErrors.firstName && (
                      <p className="text-sm text-danger">{userErrors.firstName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName" required>
                      {t('user:last_name', 'Last Name')}
                    </Label>
                    <Input 
                      id="lastName" 
                      disabled={isPending}
                      placeholder="Doe"
                      {...registerUser('lastName')}
                      className={userErrors.lastName ? 'border-danger' : ''}
                    />
                    {userErrors.lastName && (
                      <p className="text-sm text-danger">{userErrors.lastName.message}</p>
                    )}
                  </div>
                </div>
              </FormSection>
            </CardContent>

            <CardFooter className="flex justify-end gap-3 bg-neutral-50 p-4 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => resetUser()}
                disabled={!isUserDirty || isPending}
              >
                {t('common:discard_changes', 'Discard Changes')}
              </Button>
              <Button 
                type="submit" 
                isLoading={isUpdatingUser} 
                disabled={!isUserDirty || !isUserValid || isPending}
              >
                {t('common:save_changes', 'Save Changes')}
              </Button>
            </CardFooter>
          </Card>
        </form>
      )}

      {/* Contact Information Form */}
      {activeSection === 'contact' && (
        <form onSubmit={handleSubmitProfile(onSubmitProfile)} noValidate>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-bold">
                {t('user:contact_information', 'Contact Information')}
              </CardTitle>
              <CardDescription>
                {t('user:contact_info_description', 'Your contact details for notifications and service delivery.')}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6 divide-y divide-neutral-200">
              {/* Phone Number Section */}
              <FormSection 
                icon={<Phone className="h-5 w-5 text-primary" />} 
                title={t('user:phone_number', 'Phone Number')}
                description={t('user:phone_number_description', 'Your primary contact number for notifications and account recovery.')}
              >
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">
                    {t('user:phone_number', 'Phone Number')}
                  </Label>
                  <Input 
                    id="phoneNumber" 
                    type="tel" 
                    disabled={isPending}
                    placeholder="+254712345678"
                    {...registerProfile('phoneNumber')}
                    className={profileErrors.phoneNumber ? 'border-danger' : ''}
                  />
                  {profileErrors.phoneNumber && (
                    <p className="text-sm text-danger">{profileErrors.phoneNumber.message}</p>
                  )}
                  <p className="text-sm text-text-muted">
                    {t('user:phone_format_hint', 'Format: +254 followed by 9 digits')}
                  </p>
                </div>
              </FormSection>

              {/* Address Section */}
              <FormSection 
                icon={<MapPin className="h-5 w-5 text-primary" />} 
                title={t('user:address', 'Residential Address')}
                description={t('user:address_description', 'Your physical address for service delivery.')}
              >
                <div className="space-y-4">
                  {/* Street Address */}
                  <div className="space-y-2">
                    <Label htmlFor="address.street">
                      {t('user:street', 'Street Address / Building')}
                    </Label>
                    <Input 
                      id="address.street" 
                      disabled={isPending}
                      placeholder="123 Shamba Lane, Building Name"
                      {...registerProfile('address.street')}
                    />
                    {profileErrors.address?.street && (
                      <p className="text-sm text-danger">{profileErrors.address.street.message}</p>
                    )}
                  </div>

                  {/* City and County */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="address.city">
                        {t('user:city', 'City / Town')}
                      </Label>
                      <Input 
                        id="address.city" 
                        disabled={isPending}
                        placeholder="Nairobi"
                        {...registerProfile('address.city')}
                      />
                      {profileErrors.address?.city && (
                        <p className="text-sm text-danger">{profileErrors.address.city.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address.county">
                        {t('user:county', 'County')}
                      </Label>
                      <Input 
                        id="address.county" 
                        disabled={isPending}
                        placeholder="Nairobi County"
                        {...registerProfile('address.county')}
                      />
                      {profileErrors.address?.county && (
                        <p className="text-sm text-danger">{profileErrors.address.county.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Postal Code and Country */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="address.postalCode">
                        {t('user:postalCode', 'Postal Code')}
                      </Label>
                      <Input 
                        id="address.postalCode" 
                        disabled={isPending}
                        placeholder="00100"
                        {...registerProfile('address.postalCode')}
                      />
                      {profileErrors.address?.postalCode && (
                        <p className="text-sm text-danger">{profileErrors.address.postalCode.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address.country">
                        {t('user:country', 'Country')}
                      </Label>
                      <Input 
                        id="address.country" 
                        disabled={isPending}
                        placeholder="Kenya"
                        defaultValue="Kenya"
                        {...registerProfile('address.country')}
                      />
                      {profileErrors.address?.country && (
                        <p className="text-sm text-danger">{profileErrors.address.country.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              </FormSection>

              {/* Profile Completion Status */}
              <div className="pt-6 border-t border-neutral-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-text">
                      {t('user:profile_completion', 'Profile Completion')}
                    </h4>
                    <p className="text-sm text-text-muted">
                      {profile.completionPercentage}% {t('user:complete', 'complete')}
                    </p>
                  </div>
                  <div className="w-32 bg-neutral-200 rounded-full h-2">
                    <div 
                      className="bg-success h-2 rounded-full transition-all duration-300"
                      style={{ width: `${profile.completionPercentage}%` }}
                    />
                  </div>
                </div>
                
                {profile.missingFields && profile.missingFields.length > 0 && (
                  <Alert className="mt-4">
                    <AlertDescription className="text-sm">
                      <span className="font-medium">{t('user:missing_fields', 'Missing:')}</span>{' '}
                      {profile.missingFields.map(field => {
                        const fieldLabels: Record<string, string> = {
                          phoneNumber: t('user:phone_number', 'Phone Number'),
                          address: t('user:address', 'Address'),
                        };
                        return fieldLabels[field] || field;
                      }).join(', ')}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>

            <CardFooter className="flex justify-end gap-3 bg-neutral-50 p-4 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => resetProfile()}
                disabled={!isProfileDirty || isPending}
              >
                {t('common:discard_changes', 'Discard Changes')}
              </Button>
              <Button 
                type="submit" 
                isLoading={isUpdatingProfile} 
                disabled={!isProfileDirty || !isProfileValid || isPending}
              >
                {t('common:save_changes', 'Save Changes')}
              </Button>
            </CardFooter>
          </Card>
        </form>
      )}

      {/* Save All Button (floating) */}
      {isAnyDirty && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="bg-white rounded-lg shadow-lg p-4 border border-neutral-200">
            <div className="flex items-center gap-4">
              <div className="text-sm">
                <p className="font-medium">{t('user:unsaved_changes', 'You have unsaved changes')}</p>
                <p className="text-text-muted text-xs">
                  {t('user:save_to_keep_changes', 'Save your changes to keep them')}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDiscardAll}
                  disabled={isPending}
                >
                  {t('common:discard_all', 'Discard All')}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSaveAll}
                  isLoading={isPending}
                  disabled={!isAllValid}
                >
                  {t('common:save_all', 'Save All')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}