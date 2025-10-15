// FILE: src/features/wills/components/WillForm.tsx

import * as React from 'react';
import {
  useForm,
  useFieldArray,
  Controller,
  type FieldError,
  type SubmitHandler,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { PlusCircle, Trash2 } from 'lucide-react';

import {
  UpdateWillContentsSchema,
  type Will,
  type UpdateWillContentsFormInput, // form input type (z.input)
  type UpdateWillContentsInput,      // parsed output type (z.infer)
  type Asset,
} from '../../../types';
import { useCreateWill, useUpdateWillContents } from '../wills.api';
import { useAssets } from '../../assets/assets.api';
import { useFamilyTree } from '../../families/families.api';
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
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import { Separator } from '../../../components/ui/Separator';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface WillFormProps {
  will?: Will | null;
  onSuccess: () => void;
  onCancel?: () => void;
}

type FormValues = UpdateWillContentsFormInput;

// Shape for a beneficiary (from family tree)
type Heir = {
  id: string;
  firstName: string;
  lastName: string;
};

// Helper to safely read nested field errors
function getFieldError(
  cursor: unknown,
): FieldError | undefined {
  return typeof cursor === 'object' && cursor !== null && 'message' in cursor
    ? (cursor as FieldError)
    : undefined;
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

/**
 * WillForm allows creating or updating a will's contents (title + asset assignments).
 * - Uses zodResolver with UpdateWillContentsSchema
 * - For create flow: creates the will, then immediately updates contents (assignments)
 * - For edit flow: updates contents directly
 */
export function WillForm({ will, onSuccess, onCancel }: WillFormProps) {
  const { t } = useTranslation(['wills', 'common']);
  const isEditing = !!will;

  // API hooks
  const createWillMutation = useCreateWill();
  const updateWillMutation = useUpdateWillContents();
  const mutation = isEditing ? updateWillMutation : createWillMutation;
  const { isPending } = mutation;

  // Data hooks
  const { data: assetsData, isLoading: isLoadingAssets } = useAssets();
  const { data: familyTree, isLoading: isLoadingFamily } = useFamilyTree();
  const availableAssets: Asset[] = assetsData?.data ?? [];
  const availableHeirs: Heir[] = familyTree?.nodes ?? [];

  // Form setup (use input type with resolver)
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(UpdateWillContentsSchema),
    defaultValues: {
      title: '',
      assignments: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'assignments',
  });

  // Initialize when editing
  React.useEffect(() => {
    if (will) {
      reset({
        title: will.title,
        assignments: will.assignments.map((a) => ({
          assetId: a.assetId,
          beneficiaryId: a.beneficiaryId,
          sharePercentage: a.sharePercentage,
        })),
      });
    }
  }, [will, reset]);

  // Submit handler: parse to output type before API
  const onSubmit: SubmitHandler<FormValues> = (formData) => {
    const parsed: UpdateWillContentsInput = UpdateWillContentsSchema.parse(formData);

    if (isEditing && will) {
      updateWillMutation.mutate(
        { id: will.id, willData: parsed },
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
      // NOTE: Replace testatorId with the actual current user ID from your auth context or backend
      createWillMutation.mutate(
        { title: parsed.title!, testatorId: 'CURRENT_USER_ID_FROM_BACKEND' },
        {
          onSuccess: (newWill) => {
            // After creating, update assignments
            updateWillMutation.mutate(
              { id: newWill.id, willData: parsed },
              {
                onSuccess: () => {
                  toast.success(t('create_success'));
                  onSuccess();
                },
                onError: (error) =>
                  toast.error(t('create_failed_assignments'), {
                    description: extractErrorMessage(error),
                  }),
              },
            );
          },
          onError: (error) =>
            toast.error(t('create_failed'), { description: extractErrorMessage(error) }),
        },
      );
    }
  };

  if (isLoadingAssets || isLoadingFamily) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">
          {t('will_title')} <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          placeholder={t('will_title_placeholder')}
          disabled={isPending}
          {...register('title')}
        />
        {getFieldError(errors.title)?.message && (
          <p className="text-sm text-destructive">
            {getFieldError(errors.title)!.message}
          </p>
        )}
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-medium">{t('beneficiary_assignments')}</h3>
        <p className="text-sm text-muted-foreground">
          {t('beneficiary_assignments_description')}
        </p>
      </div>

      {fields.length > 0 && (
        <div className="space-y-4">
          {fields.map((field, index) => (
            <BeneficiaryAssignmentFields
              key={field.id}
              index={index}
              control={control}
              register={register}
              errors={errors}
              assets={availableAssets}
              heirs={availableHeirs}
              onRemove={() => remove(index)}
              disabled={isPending}
            />
          ))}
        </div>
      )}

      {/* Root-level array validation error */}
      {getFieldError(errors.assignments?.root)?.message && (
        <Alert variant="destructive">
          <AlertDescription>{getFieldError(errors.assignments!.root)!.message}</AlertDescription>
        </Alert>
      )}

      <Button
        type="button"
        variant="outline"
        onClick={() =>
          append({ assetId: '', beneficiaryId: '', sharePercentage: 100 })
        }
        disabled={isPending}
      >
        <PlusCircle className="mr-2 h-4 w-4" />
        {t('add_assignment')}
      </Button>

      {/* TODO: Add fields for Executor and Witnesses here */}

      <div className="flex justify-end gap-2 border-t pt-6">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isPending}
          >
            {t('common:cancel')}
          </Button>
        )}
        <Button type="submit" isLoading={isPending}>
          {isEditing ? t('common:save_changes') : t('create_will')}
        </Button>
      </div>
    </form>
  );
}

// -----------------------------------------------------------------------------
// Child component: one assignment row
// -----------------------------------------------------------------------------

interface BeneficiaryAssignmentFieldsProps {
  index: number;
  control: ReturnType<typeof useForm<FormValues>>['control'];
  register: ReturnType<typeof useForm<FormValues>>['register'];
  errors: ReturnType<typeof useForm<FormValues>>['formState']['errors'];
  assets: Asset[];
  heirs: Heir[];
  onRemove: () => void;
  disabled: boolean;
}

function BeneficiaryAssignmentFields({
  index,
  control,
  register,
  errors,
  assets,
  heirs,
  onRemove,
  disabled,
}: BeneficiaryAssignmentFieldsProps) {
  const { t } = useTranslation('wills');

  const shareError = errors.assignments?.[index]?.sharePercentage;

  return (
    <div className="relative rounded-lg border bg-muted/50 p-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>{t('asset')}</Label>
          <Controller
            name={`assignments.${index}.assetId`}
            control={control}
            render={({ field }) => (
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('select_asset_placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  {assets.map((asset) => (
                    <SelectItem key={asset.id} value={asset.id}>
                      {asset.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="space-y-2">
          <Label>{t('beneficiary')}</Label>
          <Controller
            name={`assignments.${index}.beneficiaryId`}
            control={control}
            render={({ field }) => (
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('select_beneficiary_placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  {heirs.map((heir) => (
                    <SelectItem key={heir.id} value={heir.id}>
                      {`${heir.firstName} ${heir.lastName}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <div className="mt-4">
        <Label>{t('share_percentage')}</Label>
        <Input
          type="number"
          min="0.01"
          max="100"
          step="0.01"
          disabled={disabled}
          {...register(`assignments.${index}.sharePercentage`, {
            valueAsNumber: true,
          })}
        />
        {getFieldError(shareError)?.message && (
          <p className="text-sm text-destructive">
            {getFieldError(shareError)!.message}
          </p>
        )}
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute right-1 top-1 h-7 w-7 text-muted-foreground"
        onClick={onRemove}
        disabled={disabled}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
