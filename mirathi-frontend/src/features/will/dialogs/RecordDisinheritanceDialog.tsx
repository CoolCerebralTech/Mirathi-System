import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui';
import { DisinheritanceForm } from '../forms/DisinheritanceForm';
import { useRecordDisinheritance } from '../will.api';
import type { RecordDisinheritanceInput } from '@/types/will.types';

interface RecordDisinheritanceDialogProps {
  willId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const RecordDisinheritanceDialog: React.FC<RecordDisinheritanceDialogProps> = ({ 
  willId, 
  open, 
  onOpenChange 
}) => {
  const mutation = useRecordDisinheritance(willId, {
    onSuccess: () => {
      onOpenChange(false);
    }
  });

  const handleSubmit = (data: RecordDisinheritanceInput) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-red-700">Record Exclusion (Disinheritance)</DialogTitle>
          <DialogDescription>
            Documenting why a dependant is excluded is crucial to protect your Will from being challenged under Section 26 of the Law of Succession Act.
          </DialogDescription>
        </DialogHeader>
        
        <DisinheritanceForm 
          onSubmit={handleSubmit} 
          isLoading={mutation.isPending} 
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
};