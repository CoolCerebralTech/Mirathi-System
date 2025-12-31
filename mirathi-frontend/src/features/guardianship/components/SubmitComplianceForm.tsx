import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { 
    Form, FormControl, FormField, FormItem, FormLabel, FormMessage, 
    Textarea, Button, Select, SelectTrigger, SelectValue, SelectContent, SelectItem 
} from '../../../components/ui';

import { useSubmitCompliance } from '../guardianship.api';
import { SubmitComplianceRequestSchema, type SubmitComplianceInput } from '../../../types/guardianship.types';

interface SubmitComplianceFormProps {
    guardianshipId: string;
    checkId: string; // The specific scheduled task ID
    onSuccess?: () => void;
}

export const SubmitComplianceForm: React.FC<SubmitComplianceFormProps> = ({ guardianshipId, checkId, onSuccess }) => {
  const form = useForm<SubmitComplianceInput>({
    resolver: zodResolver(SubmitComplianceRequestSchema),
    defaultValues: { method: 'COURT_PORTAL', details: '' }
  });

  const { mutate, isPending } = useSubmitCompliance(guardianshipId, { onSuccess });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => mutate({ checkId, data }))} className="space-y-4">
        
        <FormField control={form.control} name="method" render={({ field }) => (
             <FormItem>
                <FormLabel>Submission Method</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                        <SelectItem value="E_FILING">Judiciary E-Filing</SelectItem>
                        <SelectItem value="COURT_PORTAL">Mirathi Portal</SelectItem>
                        <SelectItem value="PHYSICAL">Physical Delivery</SelectItem>
                    </SelectContent>
                </Select>
                <FormMessage />
            </FormItem>
        )} />

        <FormField control={form.control} name="details" render={({ field }) => (
            <FormItem>
                <FormLabel>Report Summary / Notes</FormLabel>
                <FormControl><Textarea placeholder="Describe the report contents..." className="min-h-[100px]" {...field} /></FormControl>
                <FormMessage />
            </FormItem>
        )} />

        <Button type="submit" className="w-full" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Submit Report
        </Button>
      </form>
    </Form>
  );
};