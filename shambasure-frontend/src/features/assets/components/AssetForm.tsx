// FILE: src/features/assets/components/AssetForm.tsx (Finalized)

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import {
  CreateAssetRequestSchema,
  type Asset,
  type CreateAssetInput,
  type AssetType,
} from '../../../types/schemas/assets.schemas'; // UPGRADE: Corrected import path
import { useCreateAsset, useUpdateAsset } from '../assets.api';
import { extractErrorMessage } from '../../../api/client';

import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import { Textarea } from '../../../components/ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/Select';

interface AssetFormProps {
  asset?: Asset | null;
  onSuccess: () => void;
  onCancel?: () => void;
}

export function AssetForm({ asset, onSuccess, onCancel }: AssetFormProps) {
  const { t } = useTranslation(['assets', 'common']);
  const isEditing = !!asset;

  // UPGRADE: Internationalize the asset types array
  const ASSET_TYPES = React.useMemo(() => [
    { value: 'LAND_PARCEL', label: t('assets:type_land_parcel'), icon: '🏞️' },
    { value: 'PROPERTY', label: t('assets:type_property'), icon: '🏠' },
    { value: 'VEHICLE', label: t('assets:type_vehicle'), icon: '🚗' },
    { value: 'BANK_ACCOUNT', label: t('assets:type_bank_account'), icon: '💰' },
    { value: 'OTHER', label: t('assets:type_other'), icon: '📦' },
  ] as const, [t]);

  const createMutation = useCreateAsset();
  const updateMutation = useUpdateAsset();
  const mutation = isEditing ? updateMutation : createMutation;

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CreateAssetInput>({
    resolver: zodResolver(CreateAssetRequestSchema),
    defaultValues: asset || {
      name: '',
      description: '',
      type: 'LAND_PARCEL',
    },
  });

  React.useEffect(() => {
    if (asset) {
      reset(asset);
    }
  }, [asset, reset]);

  const onSubmit = (data: CreateAssetInput) => {
    if (isEditing && asset) {
      // UPGRADE: The mutation expects `id`, not `assetId`
      updateMutation.mutate(
        { id: asset.id, data },
        {
          onSuccess: () => {
            toast.success(t('assets:update_success'));
            onSuccess();
          },
          onError: (error) => {
            toast.error(t('assets:update_failed'), { description: extractErrorMessage(error) });
          },
        }
      );
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          toast.success(t('assets:create_success'));
          onSuccess();
        },
        onError: (error) => {
          toast.error(t('assets:create_failed'), { description: extractErrorMessage(error) });
        },
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Asset Name */}
      <div className="space-y-1">
        <Label htmlFor="name">{t('assets:asset_name')} <span className="text-destructive">*</span></Label>
        <Input
          id="name"
          placeholder={t('assets:asset_name_placeholder')}
          error={errors.name?.message}
          disabled={mutation.isPending}
          {...register('name')}
        />
      </div>

      {/* Asset Type */}
      <div className="space-y-1">
        <Label htmlFor="type">{t('assets:asset_type')} <span className="text-destructive">*</span></Label>
        <Controller
          control={control}
          name="type"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange} disabled={mutation.isPending}>
              <SelectTrigger id="type">
                <SelectValue placeholder={t('assets:select_asset_type')} />
              </SelectTrigger>
              <SelectContent>
                {ASSET_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <span className="flex items-center gap-2">
                      <span>{type.icon}</span>
                      <span>{t(type.label)}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.type && <p className="text-sm text-destructive">{errors.type.message}</p>}
      </div>

      {/* Description */}
      <div className="space-y-1">
        <Label htmlFor="description">{t('assets:description')}</Label>
        <Textarea
          id="description"
          placeholder={t('assets:description_placeholder')}
          rows={4}
          error={errors.description?.message}
          disabled={mutation.isPending}
          {...register('description')}
        />
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-2 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={mutation.isPending}>
            {t('common:cancel')}
          </Button>
        )}
        <Button type="submit" isLoading={mutation.isPending}>
          {isEditing ? t('common:save_changes') : t('common:create_asset')}
        </Button>
      </div>
    </form>
  );
}