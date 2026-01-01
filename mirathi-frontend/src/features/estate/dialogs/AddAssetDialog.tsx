// dialogs/AddAssetDialog.tsx

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui';
import { AssetForm } from '../forms/AssetForm';

interface AddAssetDialogProps {
  estateId: string;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}

export const AddAssetDialog: React.FC<AddAssetDialogProps> = ({
  estateId,
  trigger,
  open: controlledOpen,
  onOpenChange,
  onSuccess,
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  
  // Use controlled state if provided, otherwise use internal state
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Asset to Estate</DialogTitle>
          <DialogDescription>
            Record a new asset in the estate inventory. Provide detailed information 
            to ensure accurate valuation and distribution.
          </DialogDescription>
        </DialogHeader>
        <AssetForm
          estateId={estateId}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
};