// dialogs/InitiateLiquidationDialog.tsx

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui';
import { LiquidationForm } from '../forms/LiquidationForm';

interface InitiateLiquidationDialogProps {
  estateId: string;
  preselectedAssetId?: string;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}

export const InitiateLiquidationDialog: React.FC<InitiateLiquidationDialogProps> = ({
  estateId,
  preselectedAssetId,
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
          <DialogTitle>Initiate Asset Liquidation</DialogTitle>
          <DialogDescription>
            Begin the process of selling an estate asset to raise funds for debt payment 
            or distribution. Requires court approval before proceeding.
          </DialogDescription>
        </DialogHeader>
        <LiquidationForm
          estateId={estateId}
          preselectedAssetId={preselectedAssetId}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
};