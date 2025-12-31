import React from 'react';
import { PlusCircle } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '../../../../components/ui';
import { AssetForm } from '../forms/AssetForm';

interface AddAssetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  estateId: string;
}

export const AddAssetDialog: React.FC<AddAssetDialogProps> = ({ 
  open, 
  onOpenChange, 
  estateId 
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlusCircle className="h-5 w-5 text-green-600" />
            Record New Asset
          </DialogTitle>
          <DialogDescription>
            Add an item to the estate inventory. Use accurate values for the net worth calculation.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <AssetForm 
            estateId={estateId} 
            onSuccess={() => onOpenChange(false)} 
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};