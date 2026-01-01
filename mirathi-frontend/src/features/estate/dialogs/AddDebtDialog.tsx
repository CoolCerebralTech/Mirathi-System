// dialogs/AddDebtDialog.tsx

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui';
import { DebtForm } from '../forms/DebtForm';

interface AddDebtDialogProps {
  estateId: string;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}

export const AddDebtDialog: React.FC<AddDebtDialogProps> = ({
  estateId,
  trigger,
  open: controlledOpen,
  onOpenChange,
  onSuccess,
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  const handleSuccess = () => {
    setOpen(false);
    onSuccess?.();
  };

  const handleCancel = () => {
    setOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record Estate Liability</DialogTitle>
          <DialogDescription>
            Add a debt or liability to the estate. The system will automatically 
            assign priority tiers according to Section 45 of the Law of Succession Act.
          </DialogDescription>
        </DialogHeader>
        <DebtForm
          estateId={estateId}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
};