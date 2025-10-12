// FILE: src/features/admin/components/TemplateFormDialog.tsx

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';

import { 
  CreateTemplateSchema, 
  UpdateTemplateSchema,
  type CreateTemplateInput,
  type UpdateTemplateInput,
  type NotificationTemplate,
  type NotificationChannel,
} from '../../../types';
import { useCreateTemplate, useUpdateTemplate } from '../templates.api';
import { toast } from '../../../components/common/Toaster';
import { extractErrorMessage } from '../../../api/client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/Dialog';
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
// TYPE DEFINITIONS
// ============================================================================

interface TemplateFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: NotificationTemplate | null;
  mode: 'create' | 'edit';
}

// ============================================================================
// COMPONENT
// ============================================================================

export function TemplateFormDialog({ 
  open, 
  onOpenChange, 
  template,
  mode 
}: TemplateFormDialogProps) {
  const { t } = useTranslation(['admin', 'common']);
  
  const createMutation = useCreateTemplate();
  const updateMutation = useUpdateTemplate();

  const schema = mode === 'create' ? CreateTemplateSchema : UpdateTemplateSchema;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<CreateTemplateInput | UpdateTemplateInput>({
    resolver: zodResolver(schema),
    defaultValues: template ? {
      name: template.name,
      channel: template.channel,
      subject: template.subject || undefined,
      body: template.body,
    } : {
      channel: 'EMAIL',
    },
  });

  const selectedChannel = watch('channel');

  React.useEffect(() => {
    if (open && template && mode === 'edit') {
      reset({
        name: template.name,
        channel: template.channel,
        subject: template.subject || undefined,
        body: template.body,
      });
    } else if (open && mode === 'create') {
      reset({
        channel: 'EMAIL',
      });
    }
  }, [open, template, mode, reset]);

  const onSubmit = async (data: CreateTemplateInput | UpdateTemplateInput) => {
    if (mode === 'create') {
      createMutation.mutate(data as CreateTemplateInput, {
        onSuccess: () => {
          toast.success(t('admin:template_created_success'));
          onOpenChange(false);
          reset();
        },
        onError: (error) => {
          toast.error(t('common:error'), extractErrorMessage(error));
        },
      });
    } else if (template) {
      updateMutation.mutate(
        { templateId: template.id, data: data as UpdateTemplateInput },
        {
          onSuccess: () => {
            toast.success(t('admin:template_updated_success'));
            onOpenChange(false);
          },
          onError: (error) => {
            toast.error(t('common:error'), extractErrorMessage(error));
          },
        }
      );
    }
  };

  const isLoading = isSubmitting || createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? t('admin:create_template') : t('admin:edit_template')}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? t('admin:create_template_description')
              : t('admin:edit_template_description')
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Template Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              {t('admin:template_name')} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder={t('admin:template_name_placeholder')}
              error={errors.name?.message}
              disabled={isLoading}
              {...register('name')}
            />
          </div>

          {/* Channel */}
          <div className="space-y-2">
            <Label htmlFor="channel">
              {t('admin:channel')} <span className="text-destructive">*</span>
            </Label>
            <Select
              value={selectedChannel}
              onValueChange={(value) => setValue('channel', value as NotificationChannel)}
              disabled={isLoading}
            >
              <SelectTrigger id="channel">
                <SelectValue placeholder={t('admin:select_channel')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EMAIL">Email</SelectItem>
                <SelectItem value="SMS">SMS</SelectItem>
              </SelectContent>
            </Select>
            {errors.channel && (
              <p className="text-sm text-destructive">{errors.channel.message}</p>
            )}
          </div>

          {/* Subject (Email only) */}
          {selectedChannel === 'EMAIL' && (
            <div className="space-y-2">
              <Label htmlFor="subject">{t('admin:subject')}</Label>
              <Input
                id="subject"
                placeholder={t('admin:subject_placeholder')}
                error={errors.subject?.message}
                disabled={isLoading}
                {...register('subject')}
              />
            </div>
          )}

          {/* Body */}
          <div className="space-y-2">
            <Label htmlFor="body">
              {t('admin:template_body')} <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="body"
              placeholder={t('admin:template_body_placeholder')}
              rows={8}
              error={errors.body?.message}
              disabled={isLoading}
              {...register('body')}
            />
            <p className="text-xs text-muted-foreground">
              {t('admin:template_variables_hint')}
            </p>
          </div>

          {/* Variable Guide */}
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <p className="text-sm font-medium">{t('admin:available_variables')}</p>
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <code className="rounded bg-background px-2 py-1">{'{{firstName}}'}</code>
              <code className="rounded bg-background px-2 py-1">{'{{lastName}}'}</code>
              <code className="rounded bg-background px-2 py-1">{'{{email}}'}</code>
              <code className="rounded bg-background px-2 py-1">{'{{date}}'}</code>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              {t('common:cancel')}
            </Button>
            <Button type="submit" isLoading={isLoading} disabled={isLoading}>
              {mode === 'create' ? t('admin:create') : t('admin:save_changes')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}