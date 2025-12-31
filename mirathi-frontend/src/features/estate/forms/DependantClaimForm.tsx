import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormField, FormItem, FormLabel, FormControl, Input, Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Checkbox } from '../../../../components/ui';
import { useFileDependantClaim } from '../../estate.api';
import { FileDependantClaimRequestSchema, type FileDependantClaimInput, DependantRelationship } from '../../../../types/estate.types';
import { Loader2 } from 'lucide-react';

interface DependantClaimFormProps {
    estateId: string;
    onSuccess: () => void;
}

export const DependantClaimForm: React.FC<DependantClaimFormProps> = ({ estateId, onSuccess }) => {
    const form = useForm<FileDependantClaimInput>({
        resolver: zodResolver(FileDependantClaimRequestSchema),
        defaultValues: {
            monthlyMaintenanceNeeds: { amount: 0, currency: 'KES' },
            isIncapacitated: false,
            hasDisability: false
        }
    });

    const { mutate, isPending } = useFileDependantClaim(estateId);

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(data => mutate(data, { onSuccess }))} className="space-y-4">
                <FormField control={form.control} name="dependantName" render={({ field }) => (
                    <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                )} />
                
                <FormField control={form.control} name="relationship" render={({ field }) => (
                    <FormItem><FormLabel>Relationship to Deceased</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                                {Object.keys(DependantRelationship).map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </FormItem>
                )} />

                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="monthlyMaintenanceNeeds.amount" render={({ field }) => (
                        <FormItem><FormLabel>Monthly Needs (KES)</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} /></FormControl></FormItem>
                    )} />
                </div>

                <div className="space-y-2 border p-3 rounded bg-slate-50">
                    <FormField control={form.control} name="isIncapacitated" render={({ field }) => (
                        <FormItem className="flex items-center gap-2 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>Is Incapacitated?</FormLabel></FormItem>
                    )} />
                    <FormField control={form.control} name="hasDisability" render={({ field }) => (
                        <FormItem className="flex items-center gap-2 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel>Has Disability?</FormLabel></FormItem>
                    )} />
                </div>

                <Button type="submit" className="w-full" disabled={isPending}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} File Claim
                </Button>
            </form>
        </Form>
    );
};