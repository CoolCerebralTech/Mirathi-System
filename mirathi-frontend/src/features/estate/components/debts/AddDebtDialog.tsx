import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Button,
  Textarea,
  Checkbox
} from '@/components/ui';

import { 
  DebtCategory, 
  AddDebtSchema,
  type AddDebtInput 
} from '@/types/estate.types';

import { useAddDebt } from '../../estate.api';

interface AddDebtDialogProps {
  isOpen: boolean;
  onClose: () => void;
  estateId: string;
}

export const AddDebtDialog: React.FC<AddDebtDialogProps> = ({ isOpen, onClose, estateId }) => {
  const form = useForm<AddDebtInput>({
    resolver: zodResolver(AddDebtSchema),
    defaultValues: {
      creditorName: '',
      description: '',
      category: DebtCategory.OTHER,
      originalAmount: 0,
      outstandingBalance: 0,
      isSecured: false,
    },
  });

  const { mutate: addDebt, isPending } = useAddDebt(estateId, {
    onSuccess: () => {
      form.reset();
      onClose();
    },
  });

  const onSubmit = (data: AddDebtInput) => {
    // If outstanding balance isn't set, assume it equals original amount
    if (data.outstandingBalance === undefined || data.outstandingBalance === 0) {
      data.outstandingBalance = data.originalAmount;
    }
    addDebt(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Record Liability</DialogTitle>
          <DialogDescription>
            Add a debt to the estate. The system will automatically calculate legal priority (S.45).
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Debt Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(DebtCategory).map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat.replace('_', ' ')}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="creditorName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Creditor Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. KRA, Equity Bank, Aga Khan Hospital" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="originalAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Original Amount</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={e => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="outstandingBalance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Balance</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={e => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="isSecured"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Is this debt secured?</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      e.g. A mortgage attached to a title deed. This raises priority.
                    </p>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Details about this debt..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Record Debt
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};