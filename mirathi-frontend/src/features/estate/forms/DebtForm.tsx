// forms/DebtForm.tsx

import React from 'react';
import { useForm, useWatch, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarIcon, Loader2, Link2 } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui';
import { Calendar } from '@/components/ui';
import { Textarea } from '@/components/ui';
import { cn } from '@/lib/utils';

import {
  AddDebtRequestSchema,
  DebtType,
  type AddDebtInput,
} from '@/types/estate.types';
import { useAddDebt, useAssetInventory } from '../estate.api';

// 1. Define Form Type (Input shape)
type DebtFormValues = z.input<typeof AddDebtRequestSchema>;

interface DebtFormProps {
  estateId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const DebtForm: React.FC<DebtFormProps> = ({
  estateId,
  onSuccess,
  onCancel,
}) => {
  const { mutate, isPending } = useAddDebt(estateId);
  
  // Fetch assets to allow linking secured debts
  const { data: assets } = useAssetInventory(estateId, { limit: 100 });

  const form = useForm<DebtFormValues>({
    resolver: zodResolver(AddDebtRequestSchema),
    defaultValues: {
      creditorName: '',
      description: '',
      initialAmount: { amount: 0, currency: 'KES' },
      type: DebtType.UNSECURED_LOAN,
      dueDate: '',
      securedAssetId: undefined, // Optional
      referenceNumber: '',
    },
  });

  const selectedType = useWatch({ control: form.control, name: 'type' });
  
  // Determine if this type usually requires security
  const isSecurable = ([
    DebtType.SECURED_LOAN, 
    DebtType.MORTGAGE, 
    DebtType.BUSINESS_LOAN
  ] as string[]).includes(selectedType);

  const onSubmit: SubmitHandler<DebtFormValues> = (data) => {
    // If user changed type to Unsecured but left an asset linked, clean it up
    const cleanData = { ...data };
    if (!isSecurable) {
        delete (cleanData as Record<string, unknown>).securedAssetId;
    }

    mutate(cleanData as AddDebtInput, {
      onSuccess: () => {
        form.reset();
        onSuccess?.();
      },
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
        {/* --- Creditor Details --- */}
        <div className="space-y-4">
            <FormField
                control={form.control}
                name="creditorName"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Creditor Name</FormLabel>
                    <FormControl>
                    <Input placeholder="e.g. KCB Bank, Nairobi Hospital" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Liability Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value={DebtType.FUNERAL_EXPENSES}>Funeral Expense (Tier 1)</SelectItem>
                                <SelectItem value={DebtType.TESTAMENTARY_EXPENSES}>Administrative Cost (Tier 2)</SelectItem>
                                <SelectItem value={DebtType.SECURED_LOAN}>Secured Loan (Tier 3)</SelectItem>
                                <SelectItem value={DebtType.MORTGAGE}>Mortgage (Tier 3)</SelectItem>
                                <SelectItem value={DebtType.TAX_ARREARS}>Tax Arrears (Tier 4)</SelectItem>
                                <SelectItem value={DebtType.MEDICAL_BILL}>Medical Bill (Tier 5)</SelectItem>
                                <SelectItem value={DebtType.UNSECURED_LOAN}>Unsecured Loan (Tier 5)</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormDescription className="text-xs">
                            This determines the repayment priority under S.45.
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="initialAmount.amount"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Amount Owed</FormLabel>
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
            </div>
        </div>

        {/* --- Security Logic (Conditional) --- */}
        {isSecurable && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-center gap-2 mb-3 text-amber-800">
                    <Link2 className="h-4 w-4" />
                    <h4 className="text-sm font-semibold">Collateral / Security</h4>
                </div>
                
                <FormField
                    control={form.control}
                    name="securedAssetId"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-amber-900">Link to Estate Asset</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger className="bg-white border-amber-200">
                                <SelectValue placeholder="Select asset used as collateral" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {assets?.items.map((asset) => (
                                    <SelectItem key={asset.id} value={asset.id}>
                                        {asset.name} ({asset.type})
                                    </SelectItem>
                                ))}
                                {!assets?.items.length && (
                                    <SelectItem value="none" disabled>No assets available</SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                        <FormDescription className="text-amber-700/80">
                            The selected asset will be marked as 'Encumbered'.
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
        )}

        {/* --- Additional Details --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
                control={form.control}
                name="referenceNumber"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Reference / Loan No.</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                <FormItem className="flex flex-col">
                    <FormLabel>Due Date (Optional)</FormLabel>
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
                        initialFocus
                        />
                    </PopoverContent>
                    </Popover>
                    <FormMessage />
                </FormItem>
                )}
            />
        </div>

        <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
            <FormItem>
                <FormLabel>Description / Notes</FormLabel>
                <FormControl>
                <Textarea placeholder="Details about the debt..." className="resize-none" {...field} />
                </FormControl>
                <FormMessage />
            </FormItem>
            )}
        />

        {/* --- Actions --- */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isPending} className="bg-slate-900">
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Record Debt
          </Button>
        </div>
      </form>
    </Form>
  );
};