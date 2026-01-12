import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, TrendingUp } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Button,
} from '@/components/ui';

import { 
  UpdateAssetValueSchema,
  type UpdateAssetValueInput 
} from '@/types/estate.types';

import { useUpdateAssetValue } from '@/api/estate/estate.api';

interface UpdateAssetValueDialogProps {
  isOpen: boolean;
  onClose: () => void;
  assetId: string;
  estateId: string;
}

export const UpdateAssetValueDialog: React.FC<UpdateAssetValueDialogProps> = ({ 
  isOpen, 
  onClose, 
  assetId,
  estateId 
}) => {
  const form = useForm<UpdateAssetValueInput>({
    resolver: zodResolver(UpdateAssetValueSchema),
    defaultValues: {
      estimatedValue: 0,
    },
  });

  const { mutate: updateValue, isPending } = useUpdateAssetValue({
    onSuccess: () => {
      form.reset();
      onClose();
    },
  });

  const onSubmit = (data: UpdateAssetValueInput) => {
    updateValue({ estateId,assetId, data });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Update Asset Value
          </DialogTitle>
          <DialogDescription>
            Enter the new estimated value for this asset. This will update the net worth calculation.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="estimatedValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Estimated Value (KES) *</FormLabel>
                  <FormControl>
                    <Input 
                      disabled={isPending}
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      autoFocus
                      {...field} 
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isPending ? 'Updating...' : 'Update Value'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};