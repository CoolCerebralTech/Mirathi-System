// dialogs/FreezeEstateDialog.tsx

import React, { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, AlertTriangle, Unlock } from 'lucide-react';
import * as z from 'zod';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui';
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
import { Textarea } from '@/components/ui';
import { Alert, AlertDescription } from '@/components/ui';

import {
  FreezeEstateRequestSchema,
  UnfreezeEstateRequestSchema,
  type FreezeEstateInput,
  type UnfreezeEstateInput,
} from '@/types/estate.types';
import { useFreezeEstate, useUnfreezeEstate } from '../estate.api';

type FreezeFormValues = z.input<typeof FreezeEstateRequestSchema>;
type UnfreezeFormValues = z.input<typeof UnfreezeEstateRequestSchema>;

interface FreezeEstateDialogProps {
  estateId: string;
  currentlyFrozen: boolean;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}

export const FreezeEstateDialog: React.FC<FreezeEstateDialogProps> = ({
  estateId,
  currentlyFrozen,
  trigger,
  open: controlledOpen,
  onOpenChange,
  onSuccess,
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const freezeMutation = useFreezeEstate(estateId);
  const unfreezeMutation = useUnfreezeEstate(estateId);
  
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  const isPending = freezeMutation.isPending || unfreezeMutation.isPending;

  const freezeForm = useForm<FreezeFormValues>({
    resolver: zodResolver(FreezeEstateRequestSchema),
    defaultValues: {
      reason: '',
      courtOrderReference: '',
    },
  });

  const unfreezeForm = useForm<UnfreezeFormValues>({
    resolver: zodResolver(UnfreezeEstateRequestSchema),
    defaultValues: {
      reason: '',
      resolutionReference: '',
    },
  });

  const onFreezeSubmit: SubmitHandler<FreezeFormValues> = (data) => {
    freezeMutation.mutate(data as FreezeEstateInput, {
      onSuccess: () => {
        freezeForm.reset();
        setOpen(false);
        onSuccess?.();
      },
    });
  };

  const onUnfreezeSubmit: SubmitHandler<UnfreezeFormValues> = (data) => {
    unfreezeMutation.mutate(data as UnfreezeEstateInput, {
      onSuccess: () => {
        unfreezeForm.reset();
        setOpen(false);
        onSuccess?.();
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {currentlyFrozen ? (
              <>
                <Unlock className="h-5 w-5 text-green-600" />
                Unfreeze Estate
              </>
            ) : (
              <>
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                Freeze Estate
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {currentlyFrozen
              ? 'Resume estate operations after resolving the blocking issue.'
              : 'Temporarily halt all estate operations pending resolution of a dispute or legal matter.'}
          </DialogDescription>
        </DialogHeader>

        {!currentlyFrozen ? (
          <>
            <Alert className="border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800 text-sm">
                Freezing will prevent all transactions, distributions, and asset modifications 
                until the estate is unfrozen.
              </AlertDescription>
            </Alert>

            <Form {...freezeForm}>
              <form onSubmit={freezeForm.handleSubmit(onFreezeSubmit)} className="space-y-4">
                <FormField
                  control={freezeForm.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason for Freezing</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="E.g., Pending court order regarding asset dispute, creditor challenge..."
                          className="resize-none h-24"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={freezeForm.control}
                  name="courtOrderReference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Court Order Reference (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Court case or order number" {...field} />
                      </FormControl>
                      <FormDescription className="text-xs">
                        If applicable, the court order mandating the freeze
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isPending} variant="destructive">
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Freeze Estate
                  </Button>
                </div>
              </form>
            </Form>
          </>
        ) : (
          <>
            <Alert className="border-green-200 bg-green-50">
              <Unlock className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 text-sm">
                Unfreezing will restore normal operations. Ensure all issues have been resolved.
              </AlertDescription>
            </Alert>

            <Form {...unfreezeForm}>
              <form onSubmit={unfreezeForm.handleSubmit(onUnfreezeSubmit)} className="space-y-4">
                <FormField
                  control={unfreezeForm.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Resolution Summary</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="E.g., Dispute settled via mediation, court order lifted..."
                          className="resize-none h-24"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={unfreezeForm.control}
                  name="resolutionReference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Resolution Reference (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Settlement agreement or court order number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isPending} className="bg-green-600 hover:bg-green-700">
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Unfreeze Estate
                  </Button>
                </div>
              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};