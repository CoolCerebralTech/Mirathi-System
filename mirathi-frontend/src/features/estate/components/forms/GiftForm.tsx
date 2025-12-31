import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormField, FormItem, FormLabel, FormControl, Input, Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea } from '../../../../components/ui';
import { useRecordGift } from '../../estate.api';
import { RecordGiftRequestSchema, type RecordGiftInput, AssetType } from '../../../../types/estate.types';
import { Loader2 } from 'lucide-react';

interface GiftFormProps {
    estateId: string;
    onSuccess: () => void;
}

export const GiftForm: React.FC<GiftFormProps> = ({ estateId, onSuccess }) => {
    const form = useForm<RecordGiftInput>({
        resolver: zodResolver(RecordGiftRequestSchema),
        defaultValues: {
            valueAtTimeOfGift: { amount: 0, currency: 'KES' },
            isFormalGift: true
        }
    });

    const { mutate, isPending } = useRecordGift(estateId);

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(data => mutate(data, { onSuccess }))} className="space-y-4">
                <FormField control={form.control} name="recipientId" render={({ field }) => (
                    <FormItem><FormLabel>Recipient (Beneficiary ID)</FormLabel><FormControl><Input placeholder="UUID of family member" {...field} /></FormControl></FormItem>
                )} />

                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="valueAtTimeOfGift.amount" render={({ field }) => (
                        <FormItem><FormLabel>Value at Time of Gift</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="dateGiven" render={({ field }) => (
                        <FormItem><FormLabel>Date Given</FormLabel><FormControl><Input type="date" {...field} onChange={e => field.onChange(new Date(e.target.value).toISOString())} /></FormControl></FormItem>
                    )} />
                </div>

                <FormField control={form.control} name="assetType" render={({ field }) => (
                    <FormItem><FormLabel>Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                                {Object.keys(AssetType).map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </FormItem>
                )} />

                <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem>
                )} />

                <Button type="submit" className="w-full" disabled={isPending}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Record Gift
                </Button>
            </form>
        </Form>
    );
};