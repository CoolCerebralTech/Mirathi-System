// FILE: src/features/user/components/ProfileForm.tsx

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { MapPin, Phone, User, CheckCircle2, Shield } from 'lucide-react';
import { toast } from 'sonner';

import { 
  UpdateMyProfileRequestSchema, 
  type UpdateMyProfileInput,
  UpdateMyUserRequestSchema,
  type UpdateMyUserInput
} from '../../../types';
import { 
  useCurrentProfile, 
  useUpdateCurrentProfile, 
  useCurrentUser, 
  useUpdateCurrentUser 
} from '../user.api';

import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';

// ============================================================================
// SECTION 1: IDENTITY FORM (First Name, Last Name)
// ============================================================================
function IdentitySection() {
  const { t } = useTranslation(['user', 'common']);
  const { data: user } = useCurrentUser();
  const { mutate: updateUser, isPending } = useUpdateCurrentUser();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isValid },
  } = useForm<UpdateMyUserInput>({
    resolver: zodResolver(UpdateMyUserRequestSchema),
    mode: 'onTouched',
    defaultValues: {
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
    },
  });

  // Sync with server data on load
  useEffect(() => {
    if (user) reset({ firstName: user.firstName, lastName: user.lastName });
  }, [user, reset]);

  const onSubmit = (data: UpdateMyUserInput) => {
    updateUser(data, {
      onSuccess: () => {
        toast.success(t('user:identity_updated', 'Identity updated successfully'));
        reset(data); // Reset dirty state with new values
      },
      onError: () => toast.error(t('common:error_occurred', 'Failed to update identity')),
    });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-8">
      <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-start gap-4">
        <div className="p-2 bg-slate-200 rounded-lg text-slate-700">
          <User className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900">Legal Identity</h3>
          <p className="text-sm text-slate-500">Your name as it appears on official documents.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <Label htmlFor="firstName">First Name</Label>
            <Input 
              id="firstName" 
              disabled={isPending} 
              {...register('firstName')} 
              className={errors.firstName ? 'border-red-300' : ''}
            />
            {errors.firstName && <p className="text-xs text-red-600">{errors.firstName.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="lastName">Last Name</Label>
            <Input 
              id="lastName" 
              disabled={isPending} 
              {...register('lastName')} 
              className={errors.lastName ? 'border-red-300' : ''}
            />
            {errors.lastName && <p className="text-xs text-red-600">{errors.lastName.message}</p>}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button 
            type="submit" 
            isLoading={isPending} 
            disabled={!isDirty || !isValid || isPending}
            className="bg-[#0F3D3E] hover:bg-[#0F3D3E]/90 text-white min-w-[120px]"
          >
            Save Identity
          </Button>
        </div>
      </form>
    </div>
  );
}

// ============================================================================
// SECTION 2: CONTACT FORM (Address, Phone)
// ============================================================================
function ContactSection() {
  const { t } = useTranslation(['user', 'common']);
  const { data: profile } = useCurrentProfile();
  const { mutate: updateProfile, isPending } = useUpdateCurrentProfile();

  const defaultValues: UpdateMyProfileInput = {
    phoneNumber: profile?.phoneNumber ?? '',
    address: {
      street: profile?.address?.street ?? '',
      city: profile?.address?.city ?? '',
      county: profile?.address?.county ?? '',
      postalCode: profile?.address?.postalCode ?? '',
      country: profile?.address?.country ?? 'Kenya',
    },
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isValid },
  } = useForm<UpdateMyProfileInput>({
    resolver: zodResolver(UpdateMyProfileRequestSchema),
    mode: 'onTouched',
    defaultValues,
  });

  useEffect(() => {
    if (profile) {
      reset({
        phoneNumber: profile.phoneNumber ?? '',
        address: {
          street: profile.address?.street ?? '',
          city: profile.address?.city ?? '',
          county: profile.address?.county ?? '',
          postalCode: profile.address?.postalCode ?? '',
          country: profile.address?.country ?? 'Kenya',
        },
      });
    }
  }, [profile, reset]);

  const onSubmit = (data: UpdateMyProfileInput) => {
    updateProfile(data, {
      onSuccess: () => {
        toast.success(t('user:contact_updated', 'Contact details saved'));
        reset(data);
      },
      onError: () => toast.error(t('common:error_occurred', 'Update failed')),
    });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-start gap-4">
        <div className="p-2 bg-emerald-100/50 rounded-lg text-[#0F3D3E]">
          <MapPin className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900">Contact & Residence</h3>
          <p className="text-sm text-slate-500">Used for legal notices and account recovery.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-6 space-y-8">
        
        {/* Phone */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-700 uppercase tracking-wide">
            <Phone className="h-4 w-4 text-slate-400" /> Phone Contact
          </div>
          <div className="max-w-md space-y-1.5">
            <Label htmlFor="phoneNumber">Primary Mobile Number</Label>
            <Input 
              id="phoneNumber" 
              placeholder="+254..." 
              disabled={isPending} 
              {...register('phoneNumber')} 
              className={errors.phoneNumber ? 'border-red-300' : ''}
            />
            {errors.phoneNumber ? (
              <p className="text-xs text-red-600">{errors.phoneNumber.message}</p>
            ) : (
              <p className="text-[11px] text-slate-400">Format: +254 7XX XXX XXX</p>
            )}
          </div>
        </div>

        <div className="border-t border-slate-100" />

        {/* Address */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-700 uppercase tracking-wide">
            <MapPin className="h-4 w-4 text-slate-400" /> Physical Address
          </div>
          
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="address.street">Street / Building / Estate</Label>
              <Input 
                id="address.street" 
                placeholder="e.g. 123 Mirathi Towers, Westlands" 
                disabled={isPending} 
                {...register('address.street')} 
              />
              {errors.address?.street && <p className="text-xs text-red-600">{errors.address.street.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="address.city">City / Town</Label>
                <Input id="address.city" disabled={isPending} {...register('address.city')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="address.county">County</Label>
                <Input id="address.county" disabled={isPending} {...register('address.county')} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="address.postalCode">Postal Code</Label>
                <Input id="address.postalCode" disabled={isPending} {...register('address.postalCode')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="address.country">Country</Label>
                <Input 
                  id="address.country" 
                  disabled={true} 
                  defaultValue="Kenya" 
                  className="bg-slate-50 text-slate-500"
                  {...register('address.country')} 
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100">
          <Button 
            type="submit" 
            isLoading={isPending} 
            disabled={!isDirty || !isValid || isPending}
            className="bg-[#0F3D3E] hover:bg-[#0F3D3E]/90 text-white min-w-[140px]"
          >
            Update Contact Info
          </Button>
        </div>
      </form>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export function ProfileForm() {
  const { isLoading: loadingUser } = useCurrentUser();
  const { data: profile, isLoading: loadingProfile } = useCurrentProfile();
  
  const isLoading = loadingUser || loadingProfile;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-slate-200">
        <LoadingSpinner size="md" />
        <p className="mt-4 text-sm text-slate-500 animate-pulse">Loading profile data...</p>
      </div>
    );
  }

  // Calculate completion for the top banner
  const completion = profile?.completionPercentage ?? 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Profile Completion Banner */}
      <div className="bg-gradient-to-r from-[#0F3D3E] to-[#1a5f61] rounded-xl p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Shield className="h-5 w-5 text-[#C8A165]" /> 
              Profile Completeness
            </h2>
            <p className="text-slate-300 text-sm mt-1">
              Complete profiles ensure smoother legal processing.
            </p>
          </div>
          <div className="flex items-center gap-4 bg-white/10 rounded-lg p-3 backdrop-blur-sm">
            <div className="text-right">
              <span className="text-2xl font-bold">{completion}%</span>
            </div>
            <div className="w-24 h-2 bg-white/20 rounded-full">
               <div 
                 className="h-full bg-[#C8A165] rounded-full transition-all duration-1000" 
                 style={{ width: `${completion}%` }} 
               />
            </div>
            {completion === 100 && <CheckCircle2 className="h-6 w-6 text-[#C8A165]" />}
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-1 max-w-4xl">
        <IdentitySection />
        <ContactSection />
      </div>
    </div>
  );
}