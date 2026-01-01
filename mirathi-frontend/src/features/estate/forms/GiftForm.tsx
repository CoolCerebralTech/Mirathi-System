// forms/GiftForm.tsx

import React from 'react';
import { useForm, useWatch, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarIcon, Loader2, Gift as GiftIcon } from 'lucide-react';
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
import { Textarea } from '@/components/ui';
import { Checkbox } from '@/components/ui';
import { cn } from '@/lib/utils';

import {
  RecordGiftRequestSchema,
  AssetType,
  type RecordGiftInput,
} from '@/types/estate.types';
import { useRecordGift } from '../estate.api';

type GiftFormValues = z.input<typeof RecordGiftRequestSchema>;

interface GiftFormProps {
  estateId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const GiftForm: React.FC<GiftFormProps> = ({
  estateId,
  onSuccess,
  onCancel,
}) => {
  const { mutate, isPending } = useRecordGift(estateId);

  const form = useForm<GiftFormValues>({
    resolver: zodResolver(RecordGiftRequestSchema),
    defaultValues: {
      recipientId: '',
      description: '',
      assetType: AssetType.PERSONAL,
      valueAtTimeOfGift: { amount: 0, currency: 'KES' },
      dateGiven: '',
      isFormalGift: false,
      deedReference: '',
    },
  });

  const isFormalGift = useWatch({ control: form.control, name: 'isFormalGift' });

  const onSubmit: SubmitHandler<GiftFormValues> = (data) => {
    mutate(data as RecordGiftInput, {
      onSuccess: () => {
        form.reset();
        onSuccess?.();
      },
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
        <div className="rounded-lg border bg-green-50 p-4">
          <div className="flex items-center gap-2 mb-2 text-green-800">
            <GiftIcon className="h-4 w-4" />
            <h4 className="text-sm font-semibold">Section 35 Gift Inter Vivos</h4>
          </div>
          <p className="text-xs text-green-700">
            Record gifts made by the deceased during their lifetime. These may be subject 
            to "hotchpot" calculations during distribution to ensure fair treatment of beneficiaries.
          </p>
        </div>

        {/* --- Recipient Details --- */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-900">Gift Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="recipientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recipient ID</FormLabel>
                  <FormControl>
                    <Input placeholder="ID of the gift recipient" {...field} />
                  </FormControl>
                  <FormDescription className="text-xs">
                    National ID or other unique identifier
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="assetType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type of Gift</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(AssetType).map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.replace('_', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description of Gift</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="E.g., Plot of land in Kiambu, 2015 Toyota Prado, Cash gift for university fees..."
                    className="resize-none h-20"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* --- Valuation & Timing --- */}
        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-sm font-semibold text-slate-900">Valuation & Date</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="valueAtTimeOfGift.amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Value at Time of Gift</FormLabel>
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
                    Estimated market value when the gift was made
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dateGiven"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date Given</FormLabel>
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
                    When the deceased transferred the gift
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* --- Formal Gift Documentation --- */}
        <div className="space-y-4 pt-4 border-t">
          <FormField
            control={form.control}
            name="isFormalGift"
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
                    This is a Formal Gift (with Legal Documentation)
                  </FormLabel>
                  <FormDescription className="text-xs">
                    Check this if there's a deed of gift, transfer document, or other formal record
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          {isFormalGift && (
            <FormField
              control={form.control}
              name="deedReference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deed/Document Reference</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="E.g., Deed of Gift No. 12345/2020" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Reference number of the transfer document or deed
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
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
            Record Gift
          </Button>
        </div>
      </form>
    </Form>
  );
};