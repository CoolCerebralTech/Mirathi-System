// FILE: src/features/wills/components/BeneficiaryAssignmentForm.tsx

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';

import { AssignBeneficiarySchema, type AssignBeneficiaryInput } from '../../../types';
import { useAddBeneficiaryAssignment } from '../wills.api';
import { useAssets } from '../../assets/assets.api';
import { useFamilies } from '../../families/families.api';
import { toast } from '../../../components/common/Toaster';
import { extractErrorMessage } from '../../../api/client';

import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/Select';
import { Alert, AlertDescription } from '../../../components/ui/Alert';
import { Avatar } from '../../../components/common/Avatar';
import { Badge } from '../../../components/ui/Badge';
import { Info, AlertCircle } from 'lucide-react';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface BeneficiaryAssignmentFormProps {
  willId: string;
  onSuccess: () => void;
  onCancel?: () => void;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getInitials = (firstName: string, lastName: string): string => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

// ============================================================================
// COMPONENT
// ============================================================================

export function BeneficiaryAssignmentForm({ 
  willId, 
  onSuccess, 
  onCancel 
}: BeneficiaryAssignmentFormProps) {
  const { t } = useTranslation(['wills', 'common']);
  const addAssignmentMutation = useAddBeneficiaryAssignment();
  
  // Fetch data for dropdowns
  const { data: assetsData, isLoading: assetsLoading } = useAssets({ limit: 100 });
  const { data: familiesData, isLoading: familiesLoading } = useFamilies({ limit: 100 });
  
  // Flatten family members
  const allFamilyMembers = React.useMemo(() => {
    return familiesData?.data.flatMap(family => 
      family.members?.map(member => ({
        ...member,
        familyName: family.name,
      })) || []
    ) || [];
  }, [familiesData]);

  const assets = assetsData?.data || [];

  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<AssignBeneficiaryInput>({
    resolver: zodResolver(AssignBeneficiarySchema),
  });

  const selectedAssetId = watch('assetId');
  const selectedBeneficiaryId = watch('beneficiaryId');
  const sharePercent = watch('sharePercent');

  const selectedAsset = assets.find(a => a.id === selectedAssetId);
  const selectedBeneficiary = allFamilyMembers.find(m => m.userId === selectedBeneficiaryId);

  const onSubmit = (data: AssignBeneficiaryInput) => {
    addAssignmentMutation.mutate(
      { willId, data },
      {
        onSuccess: () => {
          toast.success(t('wills:beneficiary_assigned_success'));
          onSuccess();
        },
        onError: (error) => {
          toast.error(t('common:error'), extractErrorMessage(error));
        },
      }
    );
  };
  
  const isLoading = assetsLoading || familiesLoading || addAssignmentMutation.isPending;

  // ============================================================================
  // LOADING & EMPTY STATES
  // ============================================================================

  if (assetsLoading || familiesLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <Alert variant="default">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {t('wills:no_assets_available')}
        </AlertDescription>
      </Alert>
    );
  }

  if (allFamilyMembers.length === 0) {
    return (
      <Alert variant="default">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {t('wills:no_family_members_available')}
        </AlertDescription>
      </Alert>
    );
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Information Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          {t('wills:assign_beneficiary_info')}
        </AlertDescription>
      </Alert>

      {/* Select Asset */}
      <div className="space-y-2">
        <Label htmlFor="assetId">
          {t('wills:select_asset')} <span className="text-destructive">*</span>
        </Label>
        <Controller
          name="assetId"
          control={control}
          render={({ field }) => (
            <Select 
              value={field.value} 
              onValueChange={field.onChange}
              disabled={isLoading}
            >
              <SelectTrigger id="assetId">
                <SelectValue placeholder={t('wills:choose_asset_placeholder')} />
              </SelectTrigger>
              <SelectContent>
                {assets.map((asset) => (
                  <SelectItem key={asset.id} value={asset.id}>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{asset.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {asset.type.replace('_', ' ')}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.assetId && (
          <p className="text-sm text-destructive">{errors.assetId.message}</p>
        )}
        {selectedAsset && (
          <p className="text-sm text-muted-foreground">
            {selectedAsset.description || t('wills:no_description')}
          </p>
        )}
      </div>

      {/* Select Beneficiary */}
      <div className="space-y-2">
        <Label htmlFor="beneficiaryId">
          {t('wills:select_beneficiary')} <span className="text-destructive">*</span>
        </Label>
        <Controller
          name="beneficiaryId"
          control={control}
          render={({ field }) => (
            <Select 
              value={field.value} 
              onValueChange={field.onChange}
              disabled={isLoading}
            >
              <SelectTrigger id="beneficiaryId">
                <SelectValue placeholder={t('wills:choose_beneficiary_placeholder')} />
              </SelectTrigger>
              <SelectContent>
                {allFamilyMembers.map((member) => (
                  <SelectItem key={member.userId} value={member.userId}>
                    <div className="flex items-center gap-2">
                      <Avatar
                        src={undefined}
                        alt={`${member.user?.firstName} ${member.user?.lastName}`}
                        fallback={getInitials(
                          member.user?.firstName || '',
                          member.user?.lastName || ''
                        )}
                        className="h-6 w-6"
                      />
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {member.user?.firstName} {member.user?.lastName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {member.role.replace('_', ' ')} • {member.familyName}
                        </span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.beneficiaryId && (
          <p className="text-sm text-destructive">{errors.beneficiaryId.message}</p>
        )}
      </div>

      {/* Share Percentage */}
      <div className="space-y-2">
        <Label htmlFor="sharePercent">
          {t('wills:share_percentage')} ({t('wills:optional')})
        </Label>
        <Input
          id="sharePercent"
          type="number"
          min="0.01"
          max="100"
          step="0.01"
          placeholder="e.g., 50"
          error={errors.sharePercent?.message}
          disabled={isLoading}
          {...register('sharePercent', { valueAsNumber: true })}
        />
        <p className="text-xs text-muted-foreground">
          {t('wills:share_percentage_hint')}
        </p>
        {sharePercent && (
          <div className="rounded-lg bg-muted p-3">
            <p className="text-sm">
              <span className="font-medium">{selectedBeneficiary?.user?.firstName}</span>{' '}
              {t('wills:will_receive')} <span className="font-medium">{sharePercent}%</span>{' '}
              {t('wills:of')} <span className="font-medium">{selectedAsset?.name}</span>
            </p>
          </div>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-2 pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            {t('common:cancel')}
          </Button>
        )}
        <Button 
          type="submit" 
          isLoading={isLoading} 
          disabled={isLoading}
        >
          {t('wills:assign_beneficiary')}
        </Button>
      </div>
    </form>
  );
}