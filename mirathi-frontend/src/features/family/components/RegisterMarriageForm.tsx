import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { z } from 'zod';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Button,
  Checkbox,
} from '@/components/ui';

import { useRegisterMarriage } from '../family.api';
import {
  RegisterMarriageRequestSchema,
  MarriageType,
  type FamilyMemberResponse,
  type RegisterMarriageInput,
} from '@/types/family.types';

interface RegisterMarriageFormProps {
  familyId: string;
  members: FamilyMemberResponse[];
  onSuccess?: () => void;
  onCancel?: () => void;
}

// 1. DEFINE FORM TYPE AS ZOD INPUT
// We use z.input<> because the form state represents the "input" phase 
// (where defaults like 'KES' for currency haven't officially run yet in the schema logic, 
// even if we provide them in defaultValues).
type RegisterMarriageFormValues = z.input<typeof RegisterMarriageRequestSchema>;

export const RegisterMarriageForm: React.FC<RegisterMarriageFormProps> = ({
  familyId,
  members,
  onSuccess,
  onCancel,
}) => {
  // 2. INITIALIZE FORM WITH INPUT TYPE
  // This prevents the TS2719 error because z.input allows optional fields (like currency)
  // that strict Output types would reject.
  const form = useForm<RegisterMarriageFormValues>({
    resolver: zodResolver(RegisterMarriageRequestSchema),
    defaultValues: {
      marriageType: 'CIVIL',
      startDate: new Date().toISOString(),
      isPolygamous: false,
      dowryPayment: {
        amount: 0,
        currency: 'KES', // We provide the default here manually for UX
        isPaidInFull: false,
      },
    },
  });

  const { mutate, isPending } = useRegisterMarriage(familyId, {
    onSuccess: () => {
      form.reset();
      onSuccess?.();
    },
  });

  // 3. SUBMIT HANDLER
  // 'data' here is typed as FormValues (Input), but we know that 
  // if zodResolver succeeds, the data matches the Output type.
  const onSubmit = (data: RegisterMarriageFormValues) => {
    // Safe assertion: Zod validation ensures 'data' conforms to RegisterMarriageInput (Output)
    // This satisfies the API expectation without using 'any'.
    mutate(data as RegisterMarriageInput);
  };

  const watchMarriageType = form.watch('marriageType');
  const showDowry = ['CUSTOMARY', 'ISLAMIC', 'COME_WE_STAY'].includes(watchMarriageType || '');

  return (
    <Form {...form}>
      {/* 
        No casting needed here anymore. 
        form.handleSubmit expects a handler for RegisterMarriageFormValues, 
        which onSubmit now matches perfectly.
      */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        
        {/* Spouse Selection */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="spouse1Id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Spouse 1</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select member" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {members.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.identity.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="spouse2Id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Spouse 2</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select member" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {members.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.identity.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Marriage Details */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="marriageType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type of Marriage</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(MarriageType).map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date of Marriage</FormLabel>
                <FormControl>
                  <Input 
                    type="date" 
                    // Safely handle date string conversion
                    value={field.value ? String(field.value).split('T')[0] : ''}
                    onChange={(e) => {
                      const dateVal = e.target.value ? new Date(e.target.value).toISOString() : '';
                      field.onChange(dateVal);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Dowry Section (Conditional) */}
        {showDowry && (
          <div className="rounded-md border bg-amber-50/50 p-4">
            <h4 className="mb-3 text-sm font-semibold text-amber-900">Dowry / Mahr Details</h4>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dowryPayment.amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Value (KES)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field}
                        // Ensure input is treated as number
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        value={field.value || 0}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dowryPayment.isPaidInFull"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-white mt-auto">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Paid in Full?
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Register Marriage
          </Button>
        </div>
      </form>
    </Form>
  );
};