// ============================================================================
// FILE: AddDebtDialog.tsx
// ============================================================================

import React, { useEffect } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
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
  Checkbox, // Use UI component
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
    resolver: zodResolver(AddDebtSchema) as unknown as Resolver<AddDebtInput>,
    mode: 'onChange',
    defaultValues: {
      creditorName: '',
      creditorContact: '',
      description: '',
      category: DebtCategory.OTHER,
      originalAmount: 0,
      outstandingBalance: 0, // Should be 0 initially
      isSecured: false,
      securityDetails: '',
      dueDate: undefined,
    },
  });

  const { mutate: addDebt, isPending, error } = useAddDebt(estateId, {
    onSuccess: () => {
      form.reset();
      onClose();
    },
  });

  // Auto-populate outstanding balance if user hasn't typed anything yet
  const originalAmount = form.watch('originalAmount');
  const isDirtyBalance = form.getFieldState('outstandingBalance').isDirty;

  useEffect(() => {
    // Only auto-fill if the user hasn't manually touched the balance field
    if (originalAmount > 0 && !isDirtyBalance) {
      form.setValue('outstandingBalance', originalAmount);
    }
  }, [originalAmount, isDirtyBalance, form]);

  const onSubmit = (data: AddDebtInput) => {
    // Final check: if balance is 0/undefined but original is > 0, assume full amount outstanding
    const processedData: AddDebtInput = { 
      ...data,
      outstandingBalance: (data.outstandingBalance === undefined || data.outstandingBalance === 0) 
        ? data.originalAmount 
        : data.outstandingBalance
    };
    
    addDebt(processedData);
  };

  const handleClose = () => {
    if (!isPending) {
      form.reset();
      onClose();
    }
  };

  // Helper for priority display
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
                  <FormLabel>Debt Category <span className="text-red-500">*</span></FormLabel>
                  <Select 
                    disabled={isPending}
                    onValueChange={(val) => field.onChange(val as DebtCategory)} 
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
                    <FormLabel>Creditor Name <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input 
                        disabled={isPending}
                        placeholder="e.g. Equity Bank, KRA" 
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
                    <FormLabel>Original Amount (KES) <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input 
                        disabled={isPending}
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        // Handle conversion safely
                        {...field}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          field.onChange(isNaN(val) ? 0 : val);
                        }}
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
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          // We allow undefined here if user clears it
                          field.onChange(isNaN(val) ? undefined : val);
                        }}
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
                      // Safe handling of Date object for input value
                      value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : ''}
                      onChange={(e) => {
                        const dateStr = e.target.value;
                        // Convert string back to Date object for Zod
                        field.onChange(dateStr ? new Date(dateStr) : undefined);
                      }}
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
                  <FormLabel>Description <span className="text-red-500">*</span></FormLabel>
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
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isPending}
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