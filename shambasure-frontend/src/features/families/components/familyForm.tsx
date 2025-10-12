// FILE: src/features/families/components/FamilyForm.tsx

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';

import { 
  CreateFamilySchema, 
  type Family, 
  type CreateFamilyInput 
} from '../../../types';
import { useCreateFamily, useUpdateFamily } from '../families.api';
import { toast } from '../../../components/common/Toaster';
import { extractErrorMessage } from '../../../api/client';

import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import { Alert, AlertDescription } from '../../../components/ui/Alert';
import { Info } from 'lucide-react';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface FamilyFormProps {
  family?: Family | null;
  onSuccess: () => void;
  onCancel?: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function FamilyForm({ family, onSuccess, onCancel }: FamilyFormProps) {
  const { t } = useTranslation(['families', 'common']);
  const isEditing = !!family;
  
  const createMutation = useCreateFamily();
  const updateMutation = useUpdateFamily();
  const mutation = isEditing ? updateMutation : createMutation;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateFamilyInput>({
    resolver: zodResolver(CreateFamilySchema),
    defaultValues: family || {
      name: '',
    },
  });

  React.useEffect(() => {
    if (isEditing && family) {
      reset(family);
    }
  }, [family, isEditing, reset]);

  const onSubmit = async (data: CreateFamilyInput) => {
    if (isEditing && family) {
      updateMutation.mutate(
        { familyId: family.id, data },
        {
          onSuccess: () => {
            toast.success(t('families:update_success'));
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
          toast.success(t('families:create_success'));
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
      {/* Information Alert */}
      {!isEditing && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            {t('families:create_family_info')}
          </AlertDescription>
        </Alert>
      )}

      {/* Family Name */}
      <div className="space-y-2">
        <Label htmlFor="name">
          {t('families:family_name')} <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          placeholder={t('families:family_name_placeholder')}
          error={errors.name?.message}
          disabled={isLoading}
          {...register('name')}
        />
        <p className="text-xs text-muted-foreground">
          {t('families:family_name_hint')}
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
          {isEditing ? t('families:save_changes') : t('families:create_family')}
        </Button>
      </div>
    </form>
  );
}