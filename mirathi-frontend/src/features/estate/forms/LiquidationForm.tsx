// forms/LiquidationForm.tsx

import React from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, AlertTriangle } from 'lucide-react';
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
import { Textarea } from '@/components/ui';
import { Alert, AlertDescription } from '@/components/ui';

import {
  InitiateLiquidationRequestSchema,
  LiquidationType,
  type InitiateLiquidationInput,
} from '@/types/estate.types';
import { useInitiateLiquidation, useAssetInventory } from '../estate.api';

type LiquidationFormValues = z.input<typeof InitiateLiquidationRequestSchema>;

interface LiquidationFormProps {
  estateId: string;
  preselectedAssetId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const LiquidationForm: React.FC<LiquidationFormProps> = ({
  estateId,
  preselectedAssetId,
  onSuccess,
  onCancel,
}) => {
  const { mutate, isPending } = useInitiateLiquidation(estateId);
  
  // Fetch assets that can be liquidated
  const { data: assets } = useAssetInventory(estateId, { 
    status: 'ACTIVE',
    limit: 100 
  });

  const form = useForm<LiquidationFormValues>({
    resolver: zodResolver(InitiateLiquidationRequestSchema),
    defaultValues: {
      assetId: preselectedAssetId || '',
      liquidationType: LiquidationType.SALE_ON_OPEN_MARKET,
      targetAmount: { amount: 0, currency: 'KES' },
      reason: '',
    },
  });

  const onSubmit: SubmitHandler<LiquidationFormValues> = (data) => {
    mutate(data as InitiateLiquidationInput, {
      onSuccess: () => {
        form.reset();
        onSuccess?.();
      },
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 text-sm">
            Liquidation requires court approval and follows strict statutory procedures.
            Ensure all prerequisites are met before initiating.
          </AlertDescription>
        </Alert>

        {/* --- Asset Selection --- */}
        <FormField
          control={form.control}
          name="assetId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Select Asset to Liquidate</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
                disabled={!!preselectedAssetId}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an asset" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {assets?.items.map((asset) => (
                    <SelectItem key={asset.id} value={asset.id}>
                      {asset.name} - {asset.type} ({asset.currentValue.formatted})
                    </SelectItem>
                  ))}
                  {!assets?.items.length && (
                    <SelectItem value="none" disabled>
                      No assets available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* --- Liquidation Type --- */}
        <FormField
          control={form.control}
          name="liquidationType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Liquidation Method</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={LiquidationType.PUBLIC_AUCTION}>
                    Public Auction
                  </SelectItem>
                  <SelectItem value={LiquidationType.PRIVATE_TREATY}>
                    Private Treaty
                  </SelectItem>
                  <SelectItem value={LiquidationType.SALE_ON_OPEN_MARKET}>
                    Sale on Open Market
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormDescription className="text-xs">
                Public auctions are typically preferred for transparency
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* --- Target Amount --- */}
        <FormField
          control={form.control}
          name="targetAmount.amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Target Sale Amount</FormLabel>
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
                Minimum acceptable sale price
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* --- Reason --- */}
        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Justification for Liquidation</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="E.g., Required to settle priority debts, insufficient liquid assets..."
                  className="resize-none h-24"
                  {...field} 
                />
              </FormControl>
              <FormDescription className="text-xs">
                This will be included in the court application
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* --- Actions --- */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isPending} className="bg-slate-900">
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Initiate Liquidation
          </Button>
        </div>
      </form>
    </Form>
  );
};