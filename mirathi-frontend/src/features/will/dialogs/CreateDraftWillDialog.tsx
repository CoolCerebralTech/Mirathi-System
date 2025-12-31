import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui';
import { Button } from '@/components/ui';
import { WillTypeSelector } from '../components/dashboard/WillTypeSelector';
import { WillType } from '@/types/will.types';
import { useCreateDraftWill } from '../will.api';
import { useNavigate } from 'react-router-dom';

interface CreateDraftWillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateDraftWillDialog: React.FC<CreateDraftWillDialogProps> = ({ 
  open, 
  onOpenChange 
}) => {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<WillType>(WillType.STANDARD);
  
  const createMutation = useCreateDraftWill({
    onSuccess: (willId) => {
      onOpenChange(false);
      navigate(`/dashboard/will/${willId}/edit`);
    }
  });

  const handleCreate = () => {
    createMutation.mutate({
      type: selectedType,
      // Initial capacity defaults are handled by backend or can be explicit here
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Start Your Estate Plan</DialogTitle>
          <DialogDescription>
            Select the legal framework that aligns with your values. This determines how your estate is distributed under Kenyan Law.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <WillTypeSelector 
            value={selectedType} 
            onChange={setSelectedType} 
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)}
            disabled={createMutation.isPending}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCreate} 
            disabled={createMutation.isPending}
            className="bg-indigo-600 hover:bg-indigo-700 min-w-[120px]"
          >
            {createMutation.isPending ? 'Creating...' : 'Create Draft Will'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};