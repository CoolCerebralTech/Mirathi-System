import React from 'react';
import { MinusCircle } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '../../../../components/ui';
import { DebtForm } from '../forms/DebtForm';

interface AddDebtDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  estateId: string;
}

export const AddDebtDialog: React.FC<AddDebtDialogProps> = ({ 
  open, 
  onOpenChange, 
  estateId 
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MinusCircle className="h-5 w-5 text-red-600" />
            Record Liability
          </DialogTitle>
          <DialogDescription>
            Add a debt or expense claim. Correct categorization ensures S.45 compliance.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <DebtForm 
            estateId={estateId} 
            onSuccess={() => onOpenChange(false)} 
            onCancel={() => onOpenChange(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};