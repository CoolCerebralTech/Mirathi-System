// FILE: src/features/assets/components/AssetForm.tsx

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';

import { 
  CreateAssetSchema, 
  type Asset, 
  type CreateAssetInput,
  type AssetType 
} from '../../../types';
import { useCreateAsset, useUpdateAsset } from '../assets.api';
import { toast } from '../../../components/common/Toaster';
import { extractErrorMessage } from '../../../api/client';

import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import { Textarea } from '../../../components/ui/Textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/Select';

// ============================================================================
// CONSTANTS
// ============================================================================

const ASSET_TYPES: Array<{ value: AssetType; label: string; icon: string }> = [
  { value: 'LAND_PARCEL', label: 'Land Parcel', icon: '🏞️' },
  { value: 'PROPERTY', label: 'Property/Building', icon: '🏠' },
  { value: 'VEHICLE', label: 'Vehicle', icon: '🚗' },
  { value: 'BANK_ACCOUNT', label: 'Bank Account', icon: '💰' },
  { value: 'OTHER', label: 'Other', icon: '📦' },
];

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface AssetFormProps {
  asset?: Asset | null;
  onSuccess: () => void;
  onCancel?: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function AssetForm({ asset, onSuccess, onCancel }: AssetFormProps) {
  const { t } = useTranslation(['assets', 'common']);
  const isEditing = !!asset;
  
  const createMutation = useCreateAsset();
  const updateMutation = useUpdateAsset();
  const mutation = isEditing ? updateMutation : createMutation;

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateAssetInput>({
    resolver: zodResolver(CreateAssetSchema),
    defaultValues: asset || {
      name: '',
      description: '',
      type: 'LAND_PARCEL',
    },
  });

  React.useEffect(() => {
    if (isEditing && asset) {
      reset(asset);
    }
  }, [asset, isEditing, reset]);

  const onSubmit = async (data: CreateAssetInput) => {
    if (isEditing && asset) {
      updateMutation.mutate(
        { assetId: asset.id, data },
        {
          onSuccess: () => {
            toast.success(t('assets:update_success'));
            onSuccess();
          },
          onError: (error) => {
            toast.error(t('common:error'), extractErrorMessage(error));
          },
        }
      );
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          toast.success(t('assets:create_success'));
          reset();
          onSuccess();
        },
        onError: (error) => {
          toast.error(t('common:error'), extractErrorMessage(error));
        },
      });
    }
  };

  const isLoading = isSubmitting || mutation.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Asset Name */}
      <div className="space-y-2">
        <Label htmlFor="name">
          {t('assets:asset_name')} <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          placeholder={t('assets:asset_name_placeholder')}
          error={errors.name?.message}
          disabled={isLoading}
          {...register('name')}
        />
      </div>

      {/* Asset Type */}
      <div className="space-y-2">
        <Label htmlFor="type">
          {t('assets:asset_type')} <span className="text-destructive">*</span>
        </Label>
        <Controller
          control={control}
          name="type"
          render={({ field }) => (
            <Select 
              value={field.value} 
              onValueChange={field.onChange}
              disabled={isLoading}
            >
              <SelectTrigger id="type">
                <SelectValue placeholder={t('assets:select_asset_type')} />
              </SelectTrigger>
              <SelectContent>
                {ASSET_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <span className="flex items-center gap-2">
                      <span>{type.icon}</span>
                      <span>{type.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.type && (
          <p className="text-sm text-destructive">{errors.type.message}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">{t('assets:description')}</Label>
        <Textarea
          id="description"
          placeholder={t('assets:description_placeholder')}
          rows={4}
          error={errors.description?.message}
          disabled={isLoading}
          {...register('description')}
        />
        <p className="text-xs text-muted-foreground">
          {t('assets:description_hint')}
        </p>
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
        <Button type="submit" isLoading={isLoading} disabled={isLoading}>
          {isEditing ? t('assets:save_changes') : t('assets:create_asset')}
        </Button>
      </div>
    </form>
  );
}