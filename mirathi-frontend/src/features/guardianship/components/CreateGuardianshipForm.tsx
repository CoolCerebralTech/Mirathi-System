// FILE: src/features/guardianship/components/CreateGuardianshipForm.tsx

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { z } from 'zod';

import { 
    Form, FormControl, FormField, FormItem, FormLabel, FormMessage, 
    Input, Button, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, Checkbox 
} from '../../../components/ui';

import { useCreateGuardianship } from '../guardianship.api';
import { 
    CreateGuardianshipRequestSchema, 
    // We import this for the API mutation type (Output)
    type CreateGuardianshipInput 
} from '../../../types/guardianship.types';

interface CreateGuardianshipFormProps {
    wardId?: string;
    wardName?: string;
    onSuccess?: (id: string) => void;
}

// 1. DEFINE FORM STATE AS 'INPUT'
// This matches what the form holds *before* Zod transforms defaults (e.g. wardIsAlive can be undefined here)
type CreateGuardianshipFormValues = z.input<typeof CreateGuardianshipRequestSchema>;

export const CreateGuardianshipForm: React.FC<CreateGuardianshipFormProps> = ({ wardId, wardName, onSuccess }) => {
  
  // 2. INITIALIZE USEFORM WITH INPUT TYPE
  // This solves the TS2322/TS2719 mismatch error by aligning with the resolver's input expectation.
  const form = useForm<CreateGuardianshipFormValues>({
    resolver: zodResolver(CreateGuardianshipRequestSchema),
    defaultValues: {
        wardId: wardId || '', // String (Required)
        wardFirstName: wardName?.split(' ')[0] || '',
        wardLastName: wardName?.split(' ').pop() || '',
        wardDateOfBirth: '', // Input string
        guardianshipType: 'TESTAMENTARY',
        jurisdiction: 'STATUTORY',
        requiresPropertyManagement: false, // Explicitly false (not undefined)
        wardIsAlive: true, // Explicitly true (matches default)
        wardGender: 'MALE',
        // Optional fields like 'courtOrder' can be safely omitted from defaults
    },
  });

  const { mutate, isPending } = useCreateGuardianship({
    onSuccess: (data) => onSuccess?.(data.id),
  });

  // 3. SUBMIT HANDLER
  // We accept 'data' as FormValues (Input), but we know that if it passed validation,
  // it now matches CreateGuardianshipInput (Output).
  const onSubmit = (data: CreateGuardianshipFormValues) => {
      // Safe cast: Validation guarantees defaults (like wardIsAlive=true) are applied.
      mutate(data as CreateGuardianshipInput);
  };

  return (
    <Form {...form}>
      {/* 4. PASS HANDLER WITHOUT CASTING (Types now align) */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        
        <h3 className="font-semibold text-sm text-muted-foreground">Ward Details</h3>
        <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="wardFirstName" render={({ field }) => (
                <FormItem><FormLabel>First Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="wardLastName" render={({ field }) => (
                <FormItem><FormLabel>Last Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
             <FormField control={form.control} name="wardDateOfBirth" render={({ field }) => (
                <FormItem>
                    <FormLabel>Date of Birth</FormLabel>
                    <FormControl>
                        <Input 
                            type="date" 
                            {...field} 
                            // Ensure strictly string value to avoid uncontrolled inputs
                            value={field.value || ''}
                        />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )} />
             <FormField control={form.control} name="wardGender" render={({ field }) => (
                <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                            <SelectItem value="MALE">Male</SelectItem>
                            <SelectItem value="FEMALE">Female</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
            )} />
        </div>

        <h3 className="font-semibold text-sm text-muted-foreground mt-4">Legal Context</h3>
        <FormField control={form.control} name="guardianshipType" render={({ field }) => (
             <FormItem>
                <FormLabel>Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                        <SelectItem value="TESTAMENTARY">Testamentary (Will)</SelectItem>
                        <SelectItem value="STATUTORY">Statutory (Automatic)</SelectItem>
                        <SelectItem value="COURT_APPOINTED">Court Appointed</SelectItem>
                    </SelectContent>
                </Select>
                <FormMessage />
            </FormItem>
        )} />

        <FormField control={form.control} name="requiresPropertyManagement" render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                    <Checkbox 
                        checked={field.value} 
                        onCheckedChange={field.onChange} 
                    />
                </FormControl>
                <div className="space-y-1 leading-none">
                    <FormLabel>Requires Property Management?</FormLabel>
                    <p className="text-sm text-muted-foreground">If checked, Guardian must post bond (S.72).</p>
                </div>
            </FormItem>
        )} />

        <Button type="submit" className="w-full mt-4" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Open Case
        </Button>
      </form>
    </Form>
  );
};