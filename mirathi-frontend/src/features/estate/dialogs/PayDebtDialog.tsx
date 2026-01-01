// dialogs/PayDebtDialog.tsx

import React, { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import * as z from 'zod';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui';
import { Button } from '@/components/ui';

import { PayDebtRequestSchema, type PayDebtInput } from '@/types/estate.types';
import { usePayDebt } from '../estate.api';

type PayDebtFormValues = z.input<typeof PayDebtRequestSchema>;

interface PayDebtDialogProps {
  estateId: string;
  debtId: string;
  debtDescription: string;
  outstandingAmount: number;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}

export const PayDebtDialog: React.FC<PayDebtDialogProps> = ({
  estateId,
  debtId,
  debtDescription,
  outstandingAmount,
  trigger,
  open: controlledOpen,
  onOpenChange,
  onSuccess,
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const { mutate, isPending } = usePayDebt(estateId);
  
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  const form = useForm<PayDebtFormValues>({
    resolver: zodResolver(PayDebtRequestSchema),
    defaultValues: {
      amount: { amount: outstandingAmount, currency: 'KES' },
      paymentMethod: '',
      reference: '',
    },
  });

  const onSubmit: SubmitHandler<PayDebtFormValues> = (data) => {
    mutate(
      { debtId, data: data as PayDebtInput },
      {
        onSuccess: () => {
          form.reset();
          setOpen(false);
          onSuccess?.();
        },
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record Debt Payment</DialogTitle>
          <DialogDescription>
            Record a payment for: <span className="font-semibold">{debtDescription}</span>
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount.amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Amount</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-500 text-sm">KES</span>
                      <Input
                        type="number"
                        className="pl-12"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </FormControl>
                  <FormDescription className="text-xs">
                    Outstanding: KES {outstandingAmount.toLocaleString()}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Method</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Bank Transfer, M-Pesa, Cheque" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Transaction Reference (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Receipt or transaction number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} className="bg-slate-900">
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Record Payment
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};