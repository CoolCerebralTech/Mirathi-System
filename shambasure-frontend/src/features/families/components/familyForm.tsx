// FILE: src/features/families/components/FamilyForm.tsx (Finalized)

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Info } from 'lucide-react';

import { CreateFamilyRequestSchema, type CreateFamilyInput } from '../../../types/schemas/families.schemas'; // UPGRADE: Corrected imports
import { useCreateFamily } from '../families.api';
import { extractErrorMessage } from '../../../api/client';

import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import { Alert, AlertDescription } from '../../../components/ui/Alert';

interface FamilyFormProps {
  onSuccess: () => void;
  onCancel?: () => void;
}

export function FamilyForm({ onSuccess, onCancel }: FamilyFormProps) {
  const { t } = useTranslation(['families', 'common']);
  
  // UPGRADE: Removed update logic as backend doesn't support it. This is now a create-only form.
  const createMutation = useCreateFamily();

  const { register, handleSubmit, formState: { errors } } = useForm<CreateFamilyInput>({
    resolver: zodResolver(CreateFamilyRequestSchema),
    defaultValues: { name: '' },
  });

  const onSubmit = (data: CreateFamilyInput) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        toast.success(t('families:create_success'));
        onSuccess();
      },
      onError: (error) => toast.error(t('families:create_failed'), { description: extractErrorMessage(error) }),
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>{t('families:create_family_info')}</AlertDescription>
      </Alert>

      <div className="space-y-1">
        <Label htmlFor="name">{t('families:family_name')} <span className="text-destructive">*</span></Label>
        <Input
          id="name"
          placeholder={t('families:family_name_placeholder')}
          error={errors.name?.message}
          disabled={createMutation.isPending}
          {...register('name')}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={createMutation.isPending}>
            {t('common:cancel')}
          </Button>
        )}
        <Button type="submit" isLoading={createMutation.isPending}>
          {t('families:create_family')}
        </Button>
      </div>
    </form>
  );
}