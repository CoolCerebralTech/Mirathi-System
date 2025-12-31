import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui';
import { ExecutorForm } from '../forms/ExecutorForm';
import { useAppointExecutor } from '../will.api';
import type { AppointExecutorInput } from '@/types/will.types';

interface AppointExecutorDialogProps {
  willId: string;
  existingExecutorsCount: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AppointExecutorDialog: React.FC<AppointExecutorDialogProps> = ({ 
  willId, 
  existingExecutorsCount,
  open, 
  onOpenChange 
}) => {
  const mutation = useAppointExecutor(willId, {
    onSuccess: () => {
      onOpenChange(false);
    }
  });

  const handleSubmit = (data: AppointExecutorInput) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Appoint Executor</DialogTitle>
          <DialogDescription>
            Choose someone you trust to administer your estate and carry out your wishes.
          </DialogDescription>
        </DialogHeader>
        
        <ExecutorForm 
          onSubmit={handleSubmit} 
          isLoading={mutation.isPending} 
          onCancel={() => onOpenChange(false)}
          existingExecutorsCount={existingExecutorsCount}
        />
      </DialogContent>
    </Dialog>
  );
};