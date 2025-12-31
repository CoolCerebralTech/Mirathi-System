import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui';
import { WitnessForm } from '../forms/WitnessForm';
import { useAddWitness } from '../will.api';
import type { AddWitnessInput } from '@/types/will.types';

interface AddWitnessDialogProps {
  willId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddWitnessDialog: React.FC<AddWitnessDialogProps> = ({ 
  willId, 
  open, 
  onOpenChange 
}) => {
  const mutation = useAddWitness(willId, {
    onSuccess: () => {
      onOpenChange(false);
    }
  });

  const handleSubmit = (data: AddWitnessInput) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nominate Witness</DialogTitle>
          <DialogDescription>
            Add details of the people who will attest to your signature. 
            <span className="block mt-1 text-red-600 font-medium">
              Reminder: Witnesses cannot be beneficiaries.
            </span>
          </DialogDescription>
        </DialogHeader>
        
        <WitnessForm 
          onSubmit={handleSubmit} 
          isLoading={mutation.isPending} 
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
};