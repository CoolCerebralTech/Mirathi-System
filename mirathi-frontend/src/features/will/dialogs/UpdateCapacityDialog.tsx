import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui';
import { CapacityDeclarationForm } from '../forms/CapacityDeclarationForm';
import { useUpdateCapacity } from '../will.api';
import type { UpdateCapacityInput } from '@/types/will.types';

interface UpdateCapacityDialogProps {
  willId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UpdateCapacityDialog: React.FC<UpdateCapacityDialogProps> = ({ 
  willId, 
  open, 
  onOpenChange 
}) => {
  const mutation = useUpdateCapacity(willId, {
    onSuccess: () => {
      onOpenChange(false);
    }
  });

  const handleSubmit = (data: UpdateCapacityInput) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Update Mental Capacity Status</DialogTitle>
          <DialogDescription>
            Confirm your soundness of mind to ensure the legal validity of this Will (Section 5 LSA).
          </DialogDescription>
        </DialogHeader>
        
        <CapacityDeclarationForm 
          onSubmit={handleSubmit} 
          isLoading={mutation.isPending} 
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
};