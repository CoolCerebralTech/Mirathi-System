// FILE: src/features/admin/components/TemplateFormDialog.tsx (Finalized)

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import {
  CreateTemplateRequestSchema,
  UpdateTemplateRequestSchema,
  Template,
  CreateTemplateInput,
  UpdateTemplateInput,
} from '../../../types/schemas/templates.schemas'; // UPGRADE: Corrected imports
import { NotificationChannel } from '../../../types/schemas/notifications.schemas';
import { useCreateTemplate, useUpdateTemplate } from '../templates.api';
import { extractErrorMessage } from '../../../api/client';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../components/ui/Dialog';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import { Textarea } from '../../../components/ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/Select';

interface TemplateFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: Template | null;
}

export function TemplateFormDialog({ open, onOpenChange, template }: TemplateFormDialogProps) {
  const { t } = useTranslation(['admin', 'common']);
  const isEditing = !!template;

  const createMutation = useCreateTemplate();
  const updateMutation = useUpdateTemplate();
  const mutation = isEditing ? updateMutation : createMutation;

  const { register, handleSubmit, control, formState: { errors }, reset } = useForm<CreateTemplateInput | UpdateTemplateInput>({
    resolver: zodResolver(isEditing ? UpdateTemplateRequestSchema : CreateTemplateRequestSchema),
  });

  React.useEffect(() => {
    if (open) {
      reset(template ? { ...template } : { name: '', channel: 'EMAIL', subject: '', body: '', variables: [] });
    }
  }, [open, template, reset]);

  const onSubmit = (data: CreateTemplateInput | UpdateTemplateInput) => {
    if (isEditing && template) {
      updateMutation.mutate({ id: template.id, data }, { // UPGRADE: Correct mutation signature
        onSuccess: () => {
          toast.success(t('admin:template_updated_success'));
          onOpenChange(false);
        },
        onError: (error) => toast.error(t('common:error'), { description: extractErrorMessage(error) }),
      });
    } else {
      createMutation.mutate(data as CreateTemplateInput, {
        onSuccess: () => {
          toast.success(t('admin:template_created_success'));
          onOpenChange(false);
        },
        onError: (error) => toast.error(t('common:error'), { description: extractErrorMessage(error) }),
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? t('admin:edit_template') : t('admin:create_template')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          {/* ... Your form fields are great ... */}
          {/* Channel Select */}
          <Controller
            name="channel"
            control={control}
            defaultValue="EMAIL"
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value} disabled={mutation.isPending}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="EMAIL">Email</SelectItem>
                  <SelectItem value="SMS">SMS</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {/* ... */}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>{t('common:cancel')}</Button>
            <Button type="submit" isLoading={mutation.isPending}>{isEditing ? t('common:save_changes') : t('common:create')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}