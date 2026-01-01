// dialogs/AddDependantDialog.tsx

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui';
import { DependantClaimForm } from '../forms/DependantClaimForm';

interface AddDependantDialogProps {
  estateId: string;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}

export const AddDependantDialog: React.FC<AddDependantDialogProps> = ({
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
          <DialogTitle>File Dependant Claim (Section 29)</DialogTitle>
          <DialogDescription>
            Register a dependant who was financially reliant on the deceased. 
            Claims will be verified and may receive priority allocation from the estate.
          </DialogDescription>
        </DialogHeader>
        <DependantClaimForm
          estateId={estateId}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
};