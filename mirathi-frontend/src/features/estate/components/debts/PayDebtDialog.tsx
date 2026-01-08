import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, CreditCard, AlertCircle } from 'lucide-react';

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
  Alert,
  AlertDescription,
} from '@/components/ui';

import { 
  PayDebtSchema,
  type PayDebtInput,
  type DebtResponse 
} from '@/types/estate.types';

import { usePayDebt } from '../../estate.api';

interface PayDebtDialogProps {
  isOpen: boolean;
  onClose: () => void;
  estateId: string;
  debtId: string;
  debt?: DebtResponse;
}

export const PayDebtDialog: React.FC<PayDebtDialogProps> = ({ 
  isOpen, 
  onClose, 
  estateId,
  debtId,
  debt 
}) => {
  const form = useForm<PayDebtInput>({
    resolver: zodResolver(PayDebtSchema),
    defaultValues: {
      amount: debt?.outstandingBalance || 0,
    },
  });

  const { mutate: payDebt, isPending } = usePayDebt({
    onSuccess: () => {
      form.reset();
      onClose();
    },
  });

  const onSubmit = (data: PayDebtInput) => {
    payDebt({ estateId, debtId, data });
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const paymentAmount = form.watch('amount');
  const willBeFullyPaid = debt && paymentAmount >= debt.outstandingBalance;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Record Debt Payment
          </DialogTitle>
          <DialogDescription>
            Record a payment made towards this liability
          </DialogDescription>
        </DialogHeader>

        {debt && (
          <div className="space-y-2 p-4 bg-muted/50 rounded-lg border">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Creditor:</span>
              <span className="font-medium">{debt.creditorName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Category:</span>
              <span className="font-medium">{debt.category.replace(/_/g, ' ')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Original Amount:</span>
              <span className="font-medium">{formatCurrency(debt.originalAmount)}</span>
            </div>
            <div className="flex justify-between text-sm border-t pt-2">
              <span className="text-muted-foreground font-semibold">Outstanding Balance:</span>
              <span className="font-bold text-red-600">
                {formatCurrency(debt.outstandingBalance)}
              </span>
            </div>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Amount (KES) *</FormLabel>
                  <FormControl>
                    <Input 
                      disabled={isPending}
                      type="number"
                      min="0.01"
                      max={debt?.outstandingBalance}
                      step="0.01"
                      placeholder="0.00"
                      autoFocus
                      {...field} 
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Enter amount paid</span>
                    {debt && (
                      <button
                        type="button"
                        onClick={() => form.setValue('amount', debt.outstandingBalance)}
                        className="text-primary hover:underline"
                      >
                        Pay full amount
                      </button>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {willBeFullyPaid && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  This payment will fully settle the debt. The status will be updated to 
                  <strong> PAID IN FULL</strong>.
                </AlertDescription>
              </Alert>
            )}

            {!willBeFullyPaid && paymentAmount > 0 && debt && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Remaining balance after payment: <strong>{formatCurrency(debt.outstandingBalance - paymentAmount)}</strong>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending || !paymentAmount || paymentAmount <= 0}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isPending ? 'Recording...' : 'Confirm Payment'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};