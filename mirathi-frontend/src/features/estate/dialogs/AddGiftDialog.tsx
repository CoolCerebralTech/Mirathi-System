// dialogs/AddGiftDialog.tsx

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui';
import { GiftForm } from '../forms/GiftForm';

interface AddGiftDialogProps {
  estateId: string;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}

export const AddGiftDialog: React.FC<AddGiftDialogProps> = ({
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
          <DialogTitle>Record Gift Inter Vivos (Section 35)</DialogTitle>
          <DialogDescription>
            Document gifts made by the deceased during their lifetime. These may be 
            subject to hotchpot calculations to ensure fair distribution among beneficiaries.
          </DialogDescription>
        </DialogHeader>
        <GiftForm
          estateId={estateId}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
};