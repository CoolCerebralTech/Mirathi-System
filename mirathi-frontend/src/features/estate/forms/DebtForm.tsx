import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { 
    Form, FormControl, FormField, FormItem, FormLabel, FormMessage, 
    Input, Button, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, Textarea 
} from '../../../../components/ui';

import { DebtType, type AddDebtInput, AddDebtRequestSchema } from '../../../../types/estate.types';
import { useAddDebt } from '../../estate.api';

interface DebtFormProps {
    estateId: string;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export const DebtForm: React.FC<DebtFormProps> = ({ estateId, onSuccess, onCancel }) => {
    const form = useForm<AddDebtInput>({
        resolver: zodResolver(AddDebtRequestSchema),
        defaultValues: {
            type: DebtType.UNSECURED_LOAN,
            initialAmount: { amount: 0, currency: 'KES' },
        }
    });

    const { mutate, isPending } = useAddDebt(estateId, { onSuccess });

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => mutate(data))} className="space-y-4">
                
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField control={form.control} name="creditorName" render={({ field }) => (
                        <FormItem><FormLabel>Creditor Name</FormLabel><FormControl><Input placeholder="e.g. KRA, Bank, Funeral Home" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    
                    <FormField control={form.control} name="type" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Liability Category (S.45 Priority)</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                <SelectContent>
                                    <SelectItem value={DebtType.FUNERAL_EXPENSES}>Funeral Expenses (Tier 1)</SelectItem>
                                    <SelectItem value={DebtType.TESTAMENTARY_EXPENSES}>Legal/Admin Fees (Tier 2)</SelectItem>
                                    <SelectItem value={DebtType.SECURED_LOAN}>Secured Loan (Tier 3)</SelectItem>
                                    <SelectItem value={DebtType.TAX_ARREARS}>Taxes & Wages (Tier 4)</SelectItem>
                                    <SelectItem value={DebtType.UNSECURED_LOAN}>Unsecured/Personal (Tier 5)</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="initialAmount.amount" render={({ field }) => (
                        <FormItem><FormLabel>Outstanding Amount</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} /></FormControl><FormMessage /></FormItem>
                    )} />
                     <FormField control={form.control} name="initialAmount.currency" render={({ field }) => (
                        <FormItem><FormLabel>Currency</FormLabel><FormControl><Input maxLength={3} {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                     <FormField control={form.control} name="referenceNumber" render={({ field }) => (
                        <FormItem><FormLabel>Ref / Invoice No.</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                     <FormField control={form.control} name="dueDate" render={({ field }) => (
                        <FormItem><FormLabel>Due Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>

                <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Details of the expense..." {...field} /></FormControl><FormMessage /></FormItem>
                )} />

                <div className="flex justify-end gap-3 pt-2">
                    {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>}
                    <Button type="submit" disabled={isPending}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Record Liability
                    </Button>
                </div>
            </form>
        </Form>
    );
};