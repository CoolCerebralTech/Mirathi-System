import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Banknote } from 'lucide-react';
import { 
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
  Input, Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '../../../../components/ui';

import { usePayDebt } from '../../estate.api';
import { PayDebtRequestSchema, type PayDebtInput, type DebtItemResponse } from '../../../../types/estate.types';
import { MoneyDisplay } from '../../components/shared/MoneyDisplay';

interface PayDebtDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  estateId: string;
  debt: DebtItemResponse | null;
}

export const PayDebtDialog: React.FC<PayDebtDialogProps> = ({ 
  open, 
  onOpenChange, 
  estateId, 
  debt 
}) => {
  const form = useForm<PayDebtInput>({
    resolver: zodResolver(PayDebtRequestSchema),
    defaultValues: {
      amount: { amount: debt?.outstandingAmount.amount || 0, currency: 'KES' },
      paymentMethod: 'BANK_TRANSFER',
      reference: ''
    }
  });

  // Reset form when debt changes
  React.useEffect(() => {
    if (debt) {
      form.reset({
        amount: { amount: debt.outstandingAmount.amount, currency: debt.outstandingAmount.currency },
        paymentMethod: 'BANK_TRANSFER',
        reference: ''
      });
    }
  }, [debt, form]);

  const { mutate, isPending } = usePayDebt(estateId);

  const onSubmit = (data: PayDebtInput) => {
    if (!debt) return;
    mutate(
      { debtId: debt.id, data },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  if (!debt) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5 text-green-600" />
            Record Payment
          </DialogTitle>
          <DialogDescription>
            Paying <strong>{debt.creditorName}</strong>
            <br />
            Outstanding: <MoneyDisplay amount={debt.outstandingAmount} className="font-bold text-slate-700" />
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            
            <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="amount.amount" render={({ field }) => (
                    <FormItem><FormLabel>Amount Paid</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="amount.currency" render={({ field }) => (
                    <FormItem><FormLabel>Currency</FormLabel><FormControl><Input disabled {...field} /></FormControl><FormMessage /></FormItem>
                )} />
            </div>

            <FormField control={form.control} name="paymentMethod" render={({ field }) => (
                <FormItem>
                    <FormLabel>Payment Method</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                            <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                            <SelectItem value="MPESA">M-Pesa / Mobile Money</SelectItem>
                            <SelectItem value="CHEQUE">Cheque</SelectItem>
                            <SelectItem value="CASH">Cash</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
            )} />

            <FormField control={form.control} name="reference" render={({ field }) => (
                <FormItem><FormLabel>Transaction Ref (Optional)</FormLabel><FormControl><Input placeholder="e.g. QXJ45..." {...field} /></FormControl><FormMessage /></FormItem>
            )} />

            <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button type="submit" disabled={isPending}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Confirm Payment
                </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};