import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormField, FormItem, FormLabel, FormControl, Input, Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea } from '../../../../components/ui';
import { useInitiateLiquidation } from '../../estate.api';
import { InitiateLiquidationRequestSchema, type InitiateLiquidationInput, LiquidationType } from '../../../../types/estate.types';
import { Loader2 } from 'lucide-react';

interface LiquidationFormProps {
    estateId: string;
    assetId: string;
    onSuccess: () => void;
}

export const LiquidationForm: React.FC<LiquidationFormProps> = ({ estateId, assetId, onSuccess }) => {
    const form = useForm<InitiateLiquidationInput>({
        resolver: zodResolver(InitiateLiquidationRequestSchema),
        defaultValues: {
            assetId,
            targetAmount: { amount: 0, currency: 'KES' },
            liquidationType: 'PUBLIC_AUCTION'
        }
    });

    const { mutate, isPending } = useInitiateLiquidation(estateId);

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(data => mutate(data, { onSuccess }))} className="space-y-4">
                <FormField control={form.control} name="liquidationType" render={({ field }) => (
                    <FormItem><FormLabel>Method of Sale</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                                {Object.keys(LiquidationType).map(t => <SelectItem key={t} value={t}>{t.replace('_', ' ')}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="targetAmount.amount" render={({ field }) => (
                        <FormItem><FormLabel>Target Price</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="targetAmount.currency" render={({ field }) => (
                         <FormItem><FormLabel>Currency</FormLabel><FormControl><Input disabled {...field} /></FormControl></FormItem>
                    )} />
                </div>
                <FormField control={form.control} name="reason" render={({ field }) => (
                     <FormItem><FormLabel>Reason for Sale</FormLabel><FormControl><Textarea placeholder="e.g. Insolvency, difficult to distribute" {...field} /></FormControl></FormItem>
                )} />
                <Button type="submit" className="w-full" disabled={isPending}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Initiate Liquidation
                </Button>
            </form>
        </Form>
    );
};