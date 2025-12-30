// FILE: src/features/admin/components/TemplateForm.tsx

import * as React from 'react';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import {
  CreateTemplateSchema,
  UpdateTemplateSchema,
  NotificationTypeSchema,
  NotificationChannelSchema,
  type Template,
  type CreateTemplateFormInput,  // z.input<typeof CreateTemplateSchema>
  type CreateTemplateInput,       // z.infer<typeof CreateTemplateSchema>
  type UpdateTemplateFormInput,   // z.input<typeof UpdateTemplateSchema>
  type UpdateTemplateInput,       // z.infer<typeof UpdateTemplateSchema>
} from '../../../types';
import { useCreateTemplate, useUpdateTemplate } from '../../../features/admin/templates.api';
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
import { Switch } from '../../../components/ui/Switch';

interface TemplateFormProps {
  template?: Template | null;
  onSuccess: () => void;
  onCancel?: () => void;
}

// Union of form input types for create and update
type FormValues = CreateTemplateFormInput | UpdateTemplateFormInput;

function toFormDefaults(tpl?: Template | null): FormValues | undefined {
  if (!tpl) return undefined;
  // Map only fields present in the form schema and normalize null → undefined
  return {
    name: tpl.name ?? '',
    description: tpl.description ?? undefined,
    templateType: tpl.templateType ?? undefined,
    channel: tpl.channel ?? undefined,
    subject: tpl.subject ?? undefined,
    body: tpl.body ?? undefined,
    isActive: tpl.isActive ?? true,
  };
}

export function TemplateForm({ template, onSuccess, onCancel }: TemplateFormProps) {
  const { t } = useTranslation(['admin', 'common']);
  const isEditing = !!template;

  const createMutation = useCreateTemplate();
  const updateMutation = useUpdateTemplate();
  const mutation = isEditing ? updateMutation : createMutation;
  const { isPending } = mutation;

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(isEditing ? UpdateTemplateSchema : CreateTemplateSchema),
    defaultValues:
      toFormDefaults(template) ??
      ({
        name: '',
        description: undefined,
        templateType: undefined,
        channel: undefined,
        subject: '',
        body: '',
        isActive: true,
      } as FormValues),
  });

  React.useEffect(() => {
    if (template) {
      reset(toFormDefaults(template));
    }
  }, [template, reset]);

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    if (isEditing && template) {
      const parsed: UpdateTemplateInput = UpdateTemplateSchema.parse(data);
      updateMutation.mutate(
        { id: template.id, templateData: parsed },
        {
          onSuccess: () => {
            toast.success(t('toasts.template_updated'));
            onSuccess();
          },
          onError: (error) => toast.error(extractErrorMessage(error)),
        },
      );
    } else {
      const parsed: CreateTemplateInput = CreateTemplateSchema.parse(data);
      createMutation.mutate(parsed, {
        onSuccess: () => {
          toast.success(t('toasts.template_created'));
          onSuccess();
        },
        onError: (error) => toast.error(extractErrorMessage(error)),
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Name */}
      <div className="space-y-1">
        <Label htmlFor="name">{t('templates.form.name')}</Label>
        <Input id="name" disabled={isPending} {...register('name')} />
        {errors.name?.message && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-1">
        <Label htmlFor="description">{t('templates.form.description')}</Label>
        <Input id="description" disabled={isPending} {...register('description')} />
        {errors.description?.message && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      {/* Template Type */}
      <div className="space-y-1">
        <Label>{t('templates.form.type')}</Label>
        <Controller
          name="templateType"
          control={control}
          render={({ field }) => (
            <Select
              onValueChange={field.onChange}
              value={field.value}
              disabled={isPending || isEditing}
            >
              <SelectTrigger>
                <SelectValue placeholder="..." />
              </SelectTrigger>
              <SelectContent>
                {NotificationTypeSchema.options.map((o) => (
                  <SelectItem key={o} value={o}>
                    {o}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.templateType?.message && (
          <p className="text-sm text-destructive">{errors.templateType.message}</p>
        )}
      </div>

      {/* Channel */}
      <div className="space-y-1">
        <Label>{t('templates.form.channel')}</Label>
        <Controller
          name="channel"
          control={control}
          render={({ field }) => (
            <Select
              onValueChange={field.onChange}
              value={field.value}
              disabled={isPending || isEditing}
            >
              <SelectTrigger>
                <SelectValue placeholder="..." />
              </SelectTrigger>
              <SelectContent>
                {NotificationChannelSchema.options.map((o) => (
                  <SelectItem key={o} value={o}>
                    {o}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.channel?.message && (
          <p className="text-sm text-destructive">{errors.channel.message}</p>
        )}
      </div>

      {/* Subject */}
      <div className="space-y-1">
        <Label htmlFor="subject">{t('templates.form.subject')}</Label>
        <Input id="subject" disabled={isPending} {...register('subject')} />
        {errors.subject?.message && (
          <p className="text-sm text-destructive">{errors.subject.message}</p>
        )}
      </div>

      {/* Body */}
      <div className="space-y-1">
        <Label htmlFor="body">{t('templates.form.body')}</Label>
        <Textarea id="body" rows={6} disabled={isPending} {...register('body')} />
        {errors.body?.message && (
          <p className="text-sm text-destructive">{errors.body.message}</p>
        )}
      </div>

      {/* Active Switch */}
      <div className="flex items-center space-x-2">
        <Controller
          name="isActive"
          control={control}
          render={({ field }) => (
            <Switch
              id="isActive"
              checked={field.value}
              onCheckedChange={field.onChange}
              disabled={isPending}
            />
          )}
        />
        <Label htmlFor="isActive">{t('templates.form.active')}</Label>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4">
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
          {isEditing ? t('common:save_changes') : t('common:create')}
        </Button>
      </div>
    </form>
  );
}
