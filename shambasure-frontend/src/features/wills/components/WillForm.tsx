// FILE: src/features/wills/components/WillForm.tsx

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';

import { 
  CreateWillRequestSchema, 
  type Will, 
  type CreateWillInput,
  type WillStatus 
} from '../../../types';
import { useCreateWill, useUpdateWill } from '../wills.api';
import { toast } from 'sonner';
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
import { Info } from 'lucide-react';

// ============================================================================
// CONSTANTS
// ============================================================================

const WILL_STATUSES: Array<{ value: WillStatus; label: string; description: string }> = [
  { 
    value: 'DRAFT', 
    label: 'Draft', 
    description: 'Work in progress, not yet finalized' 
  },
  { 
    value: 'ACTIVE', 
    label: 'Active', 
    description: 'Current and legally binding will' 
  },
  { 
    value: 'REVOKED', 
    label: 'Revoked', 
    description: 'No longer valid or superseded' 
  },
];

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface WillFormProps {
  will?: Will | null;
  onSuccess: () => void;
  onCancel?: () => void;
}

// Extended form input to include status
type WillFormInput = CreateWillInput & {
  status?: WillStatus;
};

// ============================================================================
// COMPONENT
// ============================================================================

export function WillForm({ will, onSuccess, onCancel }: WillFormProps) {
  const { t } = useTranslation(['wills', 'common']);
  const isEditing = !!will;
  
  const createMutation = useCreateWill();
  const updateMutation = useUpdateWill();
  const mutation = isEditing ? updateMutation : createMutation;

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<WillFormInput>({
    resolver: zodResolver(CreateWillRequestSchema),
    defaultValues: isEditing && will ? {
      title: will.title,
      status: will.status,
    } : {
      title: '',
      status: 'DRAFT' as WillStatus,
    },
  });

  React.useEffect(() => {
    if (isEditing && will) {
      reset({
        title: will.title,
        status: will.status,
      });
    }
  }, [will, isEditing, reset]);

  const selectedStatus = watch('status');

  const onSubmit = (data: WillFormInput) => {
    // Extract only the fields needed for CreateWillInput
    const payload: CreateWillInput = {
      title: data.title,
    };

    if (isEditing && will) {
      updateMutation.mutate(
        { id: will.id, data: payload }, 
        {
          onSuccess: () => {
            toast.success(t('wills:update_success'));
            onSuccess();
          },
          onError: (error) => {
            const errorMessage = extractErrorMessage(error);
            toast.error(errorMessage, { 
              description: t('wills:update_failed') 
            });
          },
        }
      );
    } else {
      createMutation.mutate(
        payload, 
        {
          onSuccess: () => {
            toast.success(t('wills:create_success'));
            onSuccess();
          },
          onError: (error) => {
            const errorMessage = extractErrorMessage(error);
            toast.error(errorMessage, { 
              description: t('wills:create_failed') 
            });
          },
        }
      );
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
            {t('wills:create_will_info')}
          </AlertDescription>
        </Alert>
      )}

      {/* Will Title */}
      <div className="space-y-2">
        <Label htmlFor="title">
          {t('wills:will_title')} <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          placeholder={t('wills:will_title_placeholder')}
          error={errors.title?.message}
          disabled={isLoading}
          {...register('title')}
        />
        <p className="text-xs text-muted-foreground">
          {t('wills:will_title_hint')}
        </p>
      </div>

      {/* Will Status - Display Only for Editing */}
      {isEditing && (
        <div className="space-y-2">
          <Label htmlFor="status">
            {t('wills:will_status')}
          </Label>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Select 
                value={field.value} 
                onValueChange={field.onChange}
                disabled={isLoading}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder={t('wills:select_status')} />
                </SelectTrigger>
                <SelectContent>
                  {WILL_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{status.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {status.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.status && (
            <p className="text-sm text-destructive">{errors.status.message}</p>
          )}
        </div>
      )}

      {/* Warning for Active Status */}
      {selectedStatus === 'ACTIVE' && (
        <Alert variant="default" className="border-amber-200 bg-amber-50">
          <Info className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            {t('wills:status_warning')}
          </AlertDescription>
        </Alert>
      )}

      {/* Info for New Wills */}
      {!isEditing && (
        <Alert variant="default" className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            {t('wills:new_will_status_info', { defaultValue: 'New wills are created with DRAFT status by default.' })}
          </AlertDescription>
        </Alert>
      )}

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
          {isEditing ? t('wills:save_changes') : t('wills:create_will')}
        </Button>
      </div>
    </form>
  );
}