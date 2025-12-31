import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { 
    Form, FormControl, FormField, FormItem, FormLabel, FormMessage, 
    Input, Button, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, Textarea 
} from '../../../../components/ui';

import { AssetType, type AddAssetInput, AddAssetRequestSchema } from '../../../../types/estate.types';
import { useAddAsset } from '../../estate.api';
import { AssetTypeFields } from '../assets/AssetTypeFields';

interface AssetFormProps {
    estateId: string;
    onSuccess?: () => void;
}

export const AssetForm: React.FC<AssetFormProps> = ({ estateId, onSuccess }) => {
    const form = useForm<AddAssetInput>({
        resolver: zodResolver(AddAssetRequestSchema),
        defaultValues: {
            type: AssetType.PERSONAL,
            currentValue: { amount: 0, currency: 'KES' },
            // Defaults for nested objects to avoid undefined errors in controlled inputs
            landDetails: undefined, 
            vehicleDetails: undefined,
            financialDetails: { currency: 'KES', isJointAccount: false, accountType: 'SAVINGS' }
        }
    });

    const { mutate, isPending } = useAddAsset(estateId, { onSuccess });
    const selectedType = form.watch('type');

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => mutate(data))} className="space-y-4">
                
                {/* 1. Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                     <FormField control={form.control} name="name" render={({ field }) => (
                        <FormItem><FormLabel>Asset Name</FormLabel><FormControl><Input placeholder="e.g. Family Home" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    
                    <FormField control={form.control} name="type" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                <SelectContent>
                                    {Object.keys(AssetType).map((t) => (
                                        <SelectItem key={t} value={t}>{t.replace('_', ' ')}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="currentValue.amount" render={({ field }) => (
                        <FormItem><FormLabel>Estimated Value</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} /></FormControl><FormMessage /></FormItem>
                    )} />
                     <FormField control={form.control} name="currentValue.currency" render={({ field }) => (
                        <FormItem><FormLabel>Currency</FormLabel><FormControl><Input maxLength={3} {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>

                <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                )} />

                {/* 2. Polymorphic Fields */}
                <AssetTypeFields form={form} type={selectedType} />

                <Button type="submit" className="w-full mt-2" disabled={isPending}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save to Inventory
                </Button>
            </form>
        </Form>
    );
};