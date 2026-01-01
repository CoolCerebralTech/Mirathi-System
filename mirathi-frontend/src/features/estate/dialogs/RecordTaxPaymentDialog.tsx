// dialogs/RecordTaxPaymentDialog.tsx

import React, { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

import {
  RecordTaxPaymentRequestSchema,
  type RecordTaxPaymentInput,
} from '@/types/estate.types';
import { useRecordTaxPayment } from '../estate.api';

type TaxPaymentFormValues = z.input<typeof RecordTaxPaymentRequestSchema>;

interface RecordTaxPaymentDialogProps {
  estateId: string;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}

export const RecordTaxPaymentDialog: React.FC<RecordTaxPaymentDialogProps> = ({
  estateId,
  trigger,
  open: controlledOpen,
  onOpenChange,
  onSuccess,
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const { mutate, isPending } = useRecordTaxPayment(estateId);
  
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  const form = useForm<TaxPaymentFormValues>({
    resolver: zodResolver(RecordTaxPaymentRequestSchema),
    defaultValues: {
      amount: { amount: 0, currency: 'KES' },
      paymentType: '',
      paymentReference: '',
      paymentDate: '',
    },
  });

  const onSubmit: SubmitHandler<TaxPaymentFormValues> = (data) => {
    mutate(data as RecordTaxPaymentInput, {
      onSuccess: () => {
        form.reset();
        setOpen(false);
        onSuccess?.();
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record Tax Payment</DialogTitle>
          <DialogDescription>
            Record a tax payment made to KRA for this estate.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="paymentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Type</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Income Tax, CGT, Stamp Duty" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount.amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount Paid</FormLabel>
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
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paymentReference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Reference</FormLabel>
                  <FormControl>
                    <Input placeholder="KRA receipt or PRN number" {...field} />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Transaction or receipt number from KRA
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paymentDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Payment Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(new Date(field.value), "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ? new Date(field.value) : undefined}
                        onSelect={(date) => field.onChange(date?.toISOString())}
                        disabled={(date) => date > new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
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