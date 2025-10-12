// FILE: src/features/admin/components/TestTemplateDialog.tsx

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import type { NotificationTemplate } from '../../../types';
import { useTestTemplate } from '../templates.api';
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

// ============================================================================
// SCHEMA
// ============================================================================

const TestTemplateSchema = z.object({
  recipientEmail: z.string().email('Invalid email address'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

type TestTemplateInput = z.infer<typeof TestTemplateSchema>;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface TestTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: NotificationTemplate | null;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function TestTemplateDialog({ 
  open, 
  onOpenChange, 
  template 
}: TestTemplateDialogProps) {
  const { t } = useTranslation(['admin', 'common']);
  const testMutation = useTestTemplate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<TestTemplateInput>({
    resolver: zodResolver(TestTemplateSchema),
  });

  React.useEffect(() => {
    if (open) {
      reset();
    }
  }, [open, reset]);

  const onSubmit = async (data: TestTemplateInput) => {
    if (!template) return;

    const variables: Record<string, string> = {};
    if (data.firstName) variables.firstName = data.firstName;
    if (data.lastName) variables.lastName = data.lastName;
    variables.email = data.recipientEmail;
    variables.date = new Date().toLocaleDateString();

    testMutation.mutate(
      {
        templateId: template.id,
        recipientEmail: data.recipientEmail,
        variables,
      },
      {
        onSuccess: () => {
          toast.success(t('admin:test_template_success'));
          onOpenChange(false);
        },
        onError: (error) => {
          toast.error(t('common:error'), extractErrorMessage(error));
        },
      }
    );
  };

  const isLoading = isSubmitting || testMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('admin:test_template')}</DialogTitle>
          <DialogDescription>
            {t('admin:test_template_description', { name: template?.name })}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Recipient Email */}
          <div className="space-y-2">
            <Label htmlFor="recipientEmail">
              {t('admin:recipient_email')} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="recipientEmail"
              type="email"
              placeholder="test@example.com"
              error={errors.recipientEmail?.message}
              disabled={isLoading}
              {...register('recipientEmail')}
            />
          </div>

          {/* Test Variables */}
          <div className="space-y-4 rounded-lg bg-muted p-4">
            <p className="text-sm font-medium">{t('admin:test_variables')}</p>
            
            <div className="space-y-2">
              <Label htmlFor="firstName">{t('admin:first_name_variable')}</Label>
              <Input
                id="firstName"
                placeholder="John"
                disabled={isLoading}
                {...register('firstName')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">{t('admin:last_name_variable')}</Label>
              <Input
                id="lastName"
                placeholder="Doe"
                disabled={isLoading}
                {...register('lastName')}
              />
            </div>

            <p className="text-xs text-muted-foreground">
              {t('admin:other_variables_info')}
            </p>
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
              {t('admin:send_test')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}