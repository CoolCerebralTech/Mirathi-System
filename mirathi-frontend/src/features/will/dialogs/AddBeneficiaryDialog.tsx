import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui';
import { BeneficiaryForm } from '../forms/BeneficiaryForm';
import { useAddBeneficiary } from '../will.api';
import type { AddBeneficiaryInput } from '@/types/will.types';

interface AddBeneficiaryDialogProps {
  willId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddBeneficiaryDialog: React.FC<AddBeneficiaryDialogProps> = ({ 
  willId, 
  open, 
  onOpenChange 
}) => {
  const mutation = useAddBeneficiary(willId, {
    onSuccess: () => {
      onOpenChange(false);
    }
  });

  const handleSubmit = (data: AddBeneficiaryInput) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Beneficiary</DialogTitle>
          <DialogDescription>
            Designate who should receive a portion of your estate. You can specify assets, cash, or percentages.
          </DialogDescription>
        </DialogHeader>
        
        <BeneficiaryForm 
          onSubmit={handleSubmit} 
          isLoading={mutation.isPending} 
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
};