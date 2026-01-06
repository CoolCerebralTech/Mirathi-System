import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, AlertCircle, Info } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
  Textarea,
  Alert,
  AlertDescription
} from '@/components/ui';

import { 
  DebtCategory, 
  AddDebtSchema,
  type AddDebtInput 
} from '@/types/estate.types';

import { useAddDebt } from '../../estate.api';

interface AddDebtDialogProps {
  isOpen: boolean;
  onClose: () => void;
  estateId: string;
}

export const AddDebtDialog: React.FC<AddDebtDialogProps> = ({ 
  isOpen, 
  onClose, 
  estateId 
}) => {
  const form = useForm<AddDebtInput>({
    resolver: zodResolver(AddDebtSchema),
    mode: 'onChange',
    defaultValues: {
      creditorName: '',
      creditorContact: '',
      description: '',
      category: DebtCategory.OTHER,
      originalAmount: 0,
      outstandingBalance: 0,
      isSecured: false,
      securityDetails: '',
    },
  });

  const { mutate: addDebt, isPending, error } = useAddDebt(estateId, {
    onSuccess: () => {
      form.reset();
      onClose();
    },
  });

  // Auto-populate outstanding balance if not set
  const originalAmount = form.watch('originalAmount');
  const outstandingBalance = form.watch('outstandingBalance');

  useEffect(() => {
    if (originalAmount > 0 && (!outstandingBalance || outstandingBalance === 0)) {
      form.setValue('outstandingBalance', originalAmount);
    }
  }, [form, originalAmount, outstandingBalance]);

  const onSubmit = (data: AddDebtInput) => {
    // Ensure outstanding balance is set
    if (!data.outstandingBalance || data.outstandingBalance === 0) {
      data.outstandingBalance = data.originalAmount;
    }
    addDebt(data);
  };

  const handleClose = () => {
    if (!isPending) {
      form.reset();
      onClose();
    }
  };

  // Get priority explanation based on category
  const getPriorityExplanation = (category: DebtCategory): string => {
    switch (category) {
      case DebtCategory.FUNERAL_EXPENSES:
        return 'CRITICAL - Must be paid first (S.45 LSA)';
      case DebtCategory.TAXES_OWED:
        return 'CRITICAL - Government dues have priority';
      case DebtCategory.MORTGAGE:
      case DebtCategory.BANK_LOAN:
        return 'HIGH - Secured debts have priority';
      case DebtCategory.MEDICAL_BILLS:
        return 'HIGH - Medical expenses are prioritized';
      case DebtCategory.SACCO_LOAN:
      case DebtCategory.PERSONAL_LOAN:
        return 'MEDIUM - Standard debt priority';
      default:
        return 'LOW - General unsecured debt';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record Estate Liability</DialogTitle>
          <DialogDescription>
            Add a debt or financial obligation. The system automatically calculates legal 
            priority according to Section 45 of the Law of Succession Act.
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <strong>Legal Priority:</strong> Debts are automatically ordered by Kenyan law. 
            Funeral expenses and taxes are paid first, followed by secured debts.
          </AlertDescription>
        </Alert>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error.message || 'Failed to record debt. Please try again.'}
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            {/* DEBT CATEGORY */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Debt Category *</FormLabel>
                  <Select 
                    disabled={isPending}
                    onValueChange={field.onChange} 
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select debt category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(DebtCategory).map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat.replace(/_/g, ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {getPriorityExplanation(field.value)}
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* CREDITOR INFO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="creditorName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Creditor Name *</FormLabel>
                    <FormControl>
                      <Input 
                        disabled={isPending}
                        placeholder="e.g. Equity Bank, KRA, Aga Khan Hospital" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="creditorContact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Creditor Contact</FormLabel>
                    <FormControl>
                      <Input 
                        disabled={isPending}
                        placeholder="Phone or email (optional)" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* AMOUNTS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="originalAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Original Amount (KES) *</FormLabel>
                    <FormControl>
                      <Input 
                        disabled={isPending}
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        {...field} 
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="outstandingBalance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Outstanding Balance (KES)</FormLabel>
                    <FormControl>
                      <Input 
                        disabled={isPending}
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Defaults to original amount"
                        {...field} 
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      Leave blank if same as original amount
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* DUE DATE */}
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due Date (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      disabled={isPending}
                      type="date"
                      {...field} 
                      value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                      onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* DESCRIPTION */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description *</FormLabel>
                  <FormControl>
                    <Textarea 
                      disabled={isPending}
                      placeholder="Provide details about this debt..."
                      className="resize-none"
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* SECURED DEBT */}
            <FormField
              control={form.control}
              name="isSecured"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <input
                      type="checkbox"
                      disabled={isPending}
                      checked={field.value}
                      onChange={field.onChange}
                      className="h-4 w-4 rounded border-gray-300 mt-0.5"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>This is a secured debt</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Secured against an asset (e.g., mortgage on land, vehicle loan). 
                      This increases legal priority.
                    </p>
                  </div>
                </FormItem>
              )}
            />

            {/* SECURITY DETAILS */}
            {form.watch('isSecured') && (
              <FormField
                control={form.control}
                name="securityDetails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Security Details</FormLabel>
                    <FormControl>
                      <Textarea 
                        disabled={isPending}
                        placeholder="Describe what asset secures this debt..."
                        className="resize-none"
                        rows={2}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* ACTIONS */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isPending ? 'Recording...' : 'Record Debt'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};