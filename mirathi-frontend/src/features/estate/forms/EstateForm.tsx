// forms/EstateForm.tsx

import React from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarIcon, Loader2 } from 'lucide-react';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

import {
  CreateEstateRequestSchema,
  type CreateEstateInput,
} from '@/types/estate.types';
import { useCreateEstate } from '../estate.api';

type EstateFormValues = z.input<typeof CreateEstateRequestSchema>;

interface EstateFormProps {
  onSuccess?: (data: { id: string }) => void;
  onCancel?: () => void;
}

export const EstateForm: React.FC<EstateFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  const { mutate, isPending } = useCreateEstate({ onSuccess });

  const form = useForm<EstateFormValues>({
    resolver: zodResolver(CreateEstateRequestSchema),
    defaultValues: {
      name: '',
      deceasedId: '',
      deceasedName: '',
      dateOfDeath: '',
      kraPin: '',
      executorId: '',
      courtCaseNumber: '',
      initialCash: { amount: 0, currency: 'KES' },
    },
  });

  const onSubmit: SubmitHandler<EstateFormValues> = (data) => {
    mutate(data as CreateEstateInput);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
        {/* --- Section 1: Estate Information --- */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-900">Estate Information</h3>
          
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estate Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Estate of John Kamau" {...field} />
                </FormControl>
                <FormDescription>
                  A descriptive name for this estate administration
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="courtCaseNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Court Case Number (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., P&A 123/2024" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* --- Section 2: Deceased Information --- */}
        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-sm font-semibold text-slate-900">Deceased Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="deceasedName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Legal Name</FormLabel>
                  <FormControl>
                    <Input placeholder="As per death certificate" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="deceasedId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ID / Passport Number</FormLabel>
                  <FormControl>
                    <Input placeholder="National ID or Passport" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="dateOfDeath"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date of Death</FormLabel>
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
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="kraPin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>KRA PIN</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="A123456789Z" 
                      className="uppercase"
                      maxLength={11}
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Format: Letter + 9 digits + Letter
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* --- Section 3: Executor Information --- */}
        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-sm font-semibold text-slate-900">Executor Information</h3>
          
          <FormField
            control={form.control}
            name="executorId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Executor ID</FormLabel>
                <FormControl>
                  <Input placeholder="User ID of the executor" {...field} />
                </FormControl>
                <FormDescription className="text-xs">
                  This should be a valid user ID from your system
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* --- Section 4: Initial Cash Position --- */}
        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-sm font-semibold text-slate-900">Initial Cash Position (Optional)</h3>
          
          <FormField
            control={form.control}
            name="initialCash.amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cash on Hand</FormLabel>
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
                  Any immediate cash available at the start of administration
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* --- Actions --- */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isPending} className="bg-slate-900">
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Estate
          </Button>
        </div>
      </form>
    </Form>
  );
};