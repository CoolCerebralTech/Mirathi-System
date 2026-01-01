// dialogs/CloseEstateDialog.tsx

import React, { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
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
} from '@/components/ui/form';
import { Button } from '@/components/ui';
import { Textarea } from '@/components/ui';
import { Alert, AlertDescription } from '@/components/ui';

import {
  CloseEstateRequestSchema,
  type CloseEstateInput,
} from '@/types/estate.types';
import { useCloseEstate, useDistributionReadiness } from '../estate.api';

type CloseFormValues = z.input<typeof CloseEstateRequestSchema>;

interface CloseEstateDialogProps {
  estateId: string;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}

export const CloseEstateDialog: React.FC<CloseEstateDialogProps> = ({
  estateId,
  trigger,
  open: controlledOpen,
  onOpenChange,
  onSuccess,
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const { mutate, isPending } = useCloseEstate(estateId);
  const { data: readiness } = useDistributionReadiness(estateId);
  
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  const form = useForm<CloseFormValues>({
    resolver: zodResolver(CloseEstateRequestSchema),
    defaultValues: {
      closureNotes: '',
    },
  });

  const onSubmit: SubmitHandler<CloseFormValues> = (data) => {
    mutate(data as CloseEstateInput, {
      onSuccess: () => {
        form.reset();
        setOpen(false);
        onSuccess?.();
      },
    });
  };

  const canClose = readiness?.readinessCheck.isReady;
  const blockers = readiness?.readinessCheck.blockers || [];

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Close Estate Administration
          </DialogTitle>
          <DialogDescription>
            Finalize the estate and mark it as closed. This action signifies that all 
            debts have been paid and distributions completed.
          </DialogDescription>
        </DialogHeader>

        {/* Readiness Check */}
        {!canClose && blockers.length > 0 && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 text-sm">
              <p className="font-semibold mb-2">Estate Not Ready for Closure</p>
              <ul className="list-disc list-inside space-y-1">
                {blockers.map((blocker, idx) => (
                  <li key={idx} className="text-xs">{blocker}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {canClose && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 text-sm">
              All prerequisites met. Estate is ready for closure.
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="closureNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Closure Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Final remarks, lessons learned, or any other relevant information..."
                      className="resize-none h-24"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isPending || !canClose} 
                className="bg-green-600 hover:bg-green-700"
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Close Estate
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};