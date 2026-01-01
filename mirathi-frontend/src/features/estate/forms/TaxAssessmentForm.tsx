// forms/TaxAssessmentForm.tsx

import React from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarIcon, Loader2, Receipt } from 'lucide-react';
import { format } from 'date-fns';
import * as z from 'zod';

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
  RecordTaxAssessmentRequestSchema,
  type RecordTaxAssessmentInput,
} from '@/types/estate.types';
import { useRecordTaxAssessment } from '../estate.api';

type TaxAssessmentFormValues = z.input<typeof RecordTaxAssessmentRequestSchema>;

interface TaxAssessmentFormProps {
  estateId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const TaxAssessmentForm: React.FC<TaxAssessmentFormProps> = ({
  estateId,
  onSuccess,
  onCancel,
}) => {
  const { mutate, isPending } = useRecordTaxAssessment(estateId);

  const form = useForm<TaxAssessmentFormValues>({
    resolver: zodResolver(RecordTaxAssessmentRequestSchema),
    defaultValues: {
      assessmentReference: '',
      assessmentDate: '',
      incomeTax: { amount: 0, currency: 'KES' },
      capitalGainsTax: { amount: 0, currency: 'KES' },
      stampDuty: { amount: 0, currency: 'KES' },
    },
  });

  const onSubmit: SubmitHandler<TaxAssessmentFormValues> = (data) => {
    mutate(data as RecordTaxAssessmentInput, {
      onSuccess: () => {
        form.reset();
        onSuccess?.();
      },
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
        <div className="rounded-lg border bg-blue-50 p-4">
          <div className="flex items-center gap-2 mb-2 text-blue-800">
            <Receipt className="h-4 w-4" />
            <h4 className="text-sm font-semibold">KRA Tax Assessment</h4>
          </div>
          <p className="text-xs text-blue-700">
            Record the official tax assessment from KRA. All amounts should match 
            the assessment notice exactly.
          </p>
        </div>

        {/* --- Assessment Details --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="assessmentReference"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assessment Reference Number</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., KRA/EST/2024/12345" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="assessmentDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Assessment Date</FormLabel>
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
        </div>

        {/* --- Tax Breakdown --- */}
        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-sm font-semibold text-slate-900">Tax Breakdown</h3>
          <p className="text-xs text-slate-600">
            Enter the amounts from your assessment notice. Leave blank if not applicable.
          </p>

          <FormField
            control={form.control}
            name="incomeTax.amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Income Tax (Optional)</FormLabel>
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
                  Any income tax owed by the deceased or estate
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="capitalGainsTax.amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Capital Gains Tax (Optional)</FormLabel>
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
                  Tax on disposal of capital assets
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="stampDuty.amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stamp Duty (Optional)</FormLabel>
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
                  Stamp duty on property transfers
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* --- Actions --- */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isPending} className="bg-slate-900">
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Record Assessment
          </Button>
        </div>
      </form>
    </Form>
  );
};