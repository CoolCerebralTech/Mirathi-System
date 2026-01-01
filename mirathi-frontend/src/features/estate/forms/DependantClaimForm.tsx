// forms/DependantClaimForm.tsx

import React from 'react';
import { useForm, useWatch, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarIcon, Loader2, Users } from 'lucide-react';
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
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui';
import { cn } from '@/lib/utils';

import {
  FileDependantClaimRequestSchema,
  DependantRelationship,
  type FileDependantClaimInput,
} from '@/types/estate.types';
import { useFileDependantClaim } from '../estate.api';

type DependantClaimFormValues = z.input<typeof FileDependantClaimRequestSchema>;

interface DependantClaimFormProps {
  estateId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const DependantClaimForm: React.FC<DependantClaimFormProps> = ({
  estateId,
  onSuccess,
  onCancel,
}) => {
  const { mutate, isPending } = useFileDependantClaim(estateId);

  const form = useForm<DependantClaimFormValues>({
    resolver: zodResolver(FileDependantClaimRequestSchema),
    defaultValues: {
      dependantId: '',
      dependantName: '',
      relationship: DependantRelationship.CHILD,
      dateOfBirth: '',
      isIncapacitated: false,
      hasDisability: false,
      monthlyMaintenanceNeeds: { amount: 0, currency: 'KES' },
      custodialParentId: '',
    },
  });

  const relationship = useWatch({ control: form.control, name: 'relationship' });
  const showCustodian = relationship === DependantRelationship.CHILD;

  const onSubmit: SubmitHandler<DependantClaimFormValues> = (data) => {
    mutate(data as FileDependantClaimInput, {
      onSuccess: () => {
        form.reset();
        onSuccess?.();
      },
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
        <div className="rounded-lg border bg-purple-50 p-4">
          <div className="flex items-center gap-2 mb-2 text-purple-800">
            <Users className="h-4 w-4" />
            <h4 className="text-sm font-semibold">Section 29 Dependant Claim</h4>
          </div>
          <p className="text-xs text-purple-700">
            File a claim for a dependant who was financially reliant on the deceased.
            This is governed by Section 29 of the Law of Succession Act.
          </p>
        </div>

        {/* --- Dependant Identity --- */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-900">Dependant Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="dependantName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Legal Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Mary Wanjiku Kamau" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dependantId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ID / Birth Certificate Number</FormLabel>
                  <FormControl>
                    <Input placeholder="National ID or Birth Cert No." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="relationship"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Relationship to Deceased</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select relationship" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(DependantRelationship).map((rel) => (
                        <SelectItem key={rel} value={rel}>
                          {rel.replace('_', ' ')}
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
              name="dateOfBirth"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date of Birth (Optional)</FormLabel>
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
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription className="text-xs">
                    Helps determine if dependant is a minor
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* --- Special Circumstances --- */}
        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-sm font-semibold text-slate-900">Special Circumstances</h3>
          
          <div className="space-y-3">
            <FormField
              control={form.control}
              name="isIncapacitated"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Dependant is Incapacitated
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Unable to maintain themselves due to illness, injury, or mental incapacity
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hasDisability"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Dependant has a Disability
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Physical or mental disability requiring ongoing support
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* --- Financial Needs --- */}
        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-sm font-semibold text-slate-900">Financial Requirements</h3>
          
          <FormField
            control={form.control}
            name="monthlyMaintenanceNeeds.amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estimated Monthly Maintenance Needs</FormLabel>
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
                  Include food, shelter, education, medical care, and other necessities
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* --- Custodian (for Children) --- */}
        {showCustodian && (
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-semibold text-slate-900">Custodian Information</h3>
            
            <FormField
              control={form.control}
              name="custodialParentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Custodial Parent/Guardian ID (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="ID of person caring for the child" {...field} />
                  </FormControl>
                  <FormDescription className="text-xs">
                    If applicable, the person who will receive funds on behalf of the minor
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* --- Actions --- */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isPending} className="bg-slate-900">
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            File Claim
          </Button>
        </div>
      </form>
    </Form>
  );
};