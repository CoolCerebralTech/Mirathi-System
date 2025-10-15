// FILE: src/features/assets/components/AssetForm.tsx

import * as React from 'react';
import {
  useForm,
  Controller,
  type FieldError,
  type SubmitHandler,
  type Path,
  type FieldErrors,
  type FieldValues,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import {
  CreateAssetSchema,
  UpdateAssetSchema,
  AssetTypeSchema,
  type Asset,
  type CreateAssetFormInput, // input type for create
  type CreateAssetInput,     // parsed type for API
  type UpdateAssetFormInput, // input type for edit
  type UpdateAssetInput,     // parsed type for API
} from '../../../types';
import { useCreateAsset, useUpdateAsset } from '../assets.api';
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

// -----------------------------------------------------------------------------
// Types & config
// -----------------------------------------------------------------------------

interface AssetFormProps {
  asset?: Asset | null;
  onSuccess: () => void;
  onCancel?: () => void;
}

// Use a single alias the form will run with (union of create/edit input types)
type FormValues = CreateAssetFormInput | UpdateAssetFormInput;

type FieldConfig = {
  name: Path<FormValues>;
  label: string;
  type: 'text' | 'number';
  required?: boolean;
};

// Configuration for asset-specific fields
const ASSET_SPECIFIC_FIELDS: Record<string, FieldConfig[]> = {
  LAND_PARCEL: [
    { name: 'details.parcelNumber', label: 'parcel_number', type: 'text', required: true },
    { name: 'details.location', label: 'location', type: 'text', required: true },
    { name: 'details.acreage', label: 'acreage', type: 'number', required: true },
  ],
  BANK_ACCOUNT: [
    { name: 'details.bankName', label: 'bank_name', type: 'text', required: true },
    { name: 'details.accountNumber', label: 'account_number', type: 'text', required: true },
    { name: 'details.branch', label: 'branch', type: 'text', required: true },
  ],
  VEHICLE: [
    { name: 'details.make', label: 'make', type: 'text', required: true },
    { name: 'details.model', label: 'model', type: 'text', required: true },
    { name: 'details.year', label: 'year', type: 'number', required: true },
    { name: 'details.licensePlate', label: 'license_plate', type: 'text', required: true },
  ],
  OTHER: [],
};

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

// Safely read nested field error by a dot path (e.g., "details.parcelNumber")
function getFieldError<FormValues extends FieldValues>(
  errors: FieldErrors<FormValues>,
  path: Path<FormValues>,
): FieldError | undefined {
  const parts = path.split('.') as string[];
  let cursor: unknown = errors; // 👈 no 'any'

  for (const key of parts) {
    if (
      cursor &&
      typeof cursor === 'object' &&
      key in (cursor as Record<string, unknown>)
    ) {
      cursor = (cursor as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }

  return typeof cursor === 'object' && cursor !== null && 'message' in cursor
    ? (cursor as FieldError)
    : undefined;
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export function AssetForm({ asset, onSuccess, onCancel }: AssetFormProps) {
  const { t } = useTranslation(['assets', 'common', 'validation']);
  const isEditing = !!asset;

  const createMutation = useCreateAsset();
  const updateMutation = useUpdateAsset();
  const mutation = isEditing ? updateMutation : createMutation;
  const { isPending } = mutation;

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(isEditing ? UpdateAssetSchema : CreateAssetSchema),
    defaultValues: isEditing
      ? { ...asset, description: asset?.description ?? undefined }
      : {
          name: '',
          description: '',
          type: 'LAND_PARCEL',
          details: { parcelNumber: '', location: '', acreage: 0 },
        },
  });

  const selectedAssetType = watch('type');

  React.useEffect(() => {
    if (asset) {
      reset({ ...asset, description: asset.description ?? undefined });
    }
  }, [asset, reset]);

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    if (isEditing && asset) {
      const parsed: UpdateAssetInput = UpdateAssetSchema.parse(data);
      updateMutation.mutate(
        { id: asset.id, assetData: parsed },
        {
          onSuccess: () => {
            toast.success(t('update_success'));
            onSuccess();
          },
          onError: (error) =>
            toast.error(t('update_failed'), { description: extractErrorMessage(error) }),
        },
      );
    } else {
      const parsed: CreateAssetInput = CreateAssetSchema.parse(data);
      createMutation.mutate(parsed, {
        onSuccess: () => {
          toast.success(t('create_success'));
          onSuccess();
        },
        onError: (error) =>
          toast.error(t('create_failed'), { description: extractErrorMessage(error) }),
      });
    }
  };

  const renderSpecificFields = () => {
    const fields = ASSET_SPECIFIC_FIELDS[selectedAssetType] ?? [];
    if (fields.length === 0) return null;

    return (
      <div className="space-y-4 border-t pt-4">
        <h4 className="font-medium">{t('asset_details')}</h4>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {fields.map(({ name, label, type, required }) => {
            const fieldError = getFieldError(errors, name);

            return (
              <div key={name} className="space-y-2">
                <Label htmlFor={name}>
                  {t(label)} {required && <span className="text-destructive">*</span>}
                </Label>
                <Input
                  id={name}
                  type={type}
                  disabled={isPending}
                  aria-invalid={!!fieldError}
                  aria-describedby={`${name}-error`}
                  // No `any` — name is typed as Path<FormValues>
                  {...register(name, { valueAsNumber: type === 'number' })}
                />
                {fieldError?.message && (
                  <p id={`${name}-error`} className="text-sm text-destructive">
                    {fieldError.message}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">
            {t('asset_name')} <span className="text-destructive">*</span>
          </Label>
          <Input id="name" disabled={isPending} {...register('name')} />
          {getFieldError(errors, 'name')?.message && (
            <p className="text-sm text-destructive">
              {getFieldError(errors, 'name')!.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="type">
            {t('asset_type')} <span className="text-destructive">*</span>
          </Label>
          <Controller
            control={control}
            name={'type'}
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={isPending || isEditing}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AssetTypeSchema.options.map((type) => (
                    <SelectItem key={type} value={type}>
                      {t(`type_options.${type}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {getFieldError(errors, 'type')?.message && (
            <p className="text-sm text-destructive">
              {getFieldError(errors, 'type')!.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">{t('description_optional')}</Label>
        <Textarea id="description" rows={3} disabled={isPending} {...register('description')} />
        {getFieldError(errors, 'description')?.message && (
          <p className="text-sm text-destructive">
            {getFieldError(errors, 'description')!.message}
          </p>
        )}
      </div>

      {renderSpecificFields()}

      <div className="flex justify-end gap-2 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
            {t('common:cancel')}
          </Button>
        )}
        <Button type="submit" isLoading={isPending}>
          {isEditing ? t('common:save_changes') : t('common:create_asset')}
        </Button>
      </div>
    </form>
  );
}
