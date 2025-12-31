import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui';
import { CodicilForm } from '../forms/CodicilForm';
import { useAddCodicil } from '../will.api';
import type { AddCodicilInput } from '@/types/will.types';

interface AddCodicilDialogProps {
  willId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddCodicilDialog: React.FC<AddCodicilDialogProps> = ({ 
  willId, 
  open, 
  onOpenChange 
}) => {
  const mutation = useAddCodicil(willId, {
    onSuccess: () => {
      onOpenChange(false);
    }
  });

  const handleSubmit = (data: AddCodicilInput) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Draft New Codicil</DialogTitle>
          <DialogDescription>
            A Codicil allows you to make minor changes (amendments) to your Will without rewriting the entire document.
          </DialogDescription>
        </DialogHeader>
        
        <CodicilForm 
          onSubmit={handleSubmit} 
          isLoading={mutation.isPending} 
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
};