// FILE: src/features/admin/components/TestTemplateDialog.tsx (Finalized)

/*
  ARCHITECTURAL NOTE:

  This component is well-designed, but the backend controller (`templates.controller.ts`)
  does not currently have an endpoint for sending a test notification. As such, the
  `useTestTemplate` hook and this component cannot be fully functional.

  This file is being kept as a placeholder. If the backend team adds a
  `POST /templates/:id/test` endpoint in the future, the logic in `templates.api.ts`
  and this component can be uncommented and activated.
*/

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../../components/ui/Dialog';
import { Template } from '../../../types/schemas/templates.schemas';

interface TestTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: Template | null;
}

export function TestTemplateDialog({ open, onOpenChange, template }: TestTemplateDialogProps) {
  const { t } = useTranslation(['admin']);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('admin:test_template')}</DialogTitle>
          <DialogDescription>
            {t('admin:test_functionality_coming_soon')}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            {t('admin:test_functionality_description', { name: template?.name })}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}