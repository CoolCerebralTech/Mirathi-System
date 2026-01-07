import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Gift, AlertCircle } from 'lucide-react';
import { 
  Button, 
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
  Textarea,
  Alert,
  AlertDescription
} from '@/components/ui';
import { 
  AddBeneficiarySchema, 
  type AddBeneficiaryInput, 
  BeneficiaryType, 
  BequestType 
} from '@/types/estate.types';
import { useAddBeneficiary } from '../../estate.api';

interface AddBeneficiaryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  willId: string;
}

export const AddBeneficiaryDialog: React.FC<AddBeneficiaryDialogProps> = ({ 
  isOpen, 
  onClose, 
  willId 
}) => {
  const [selectedBequestType, setSelectedBequestType] = useState<BequestType>(BequestType.RESIDUAL);
  
  const form = useForm<AddBeneficiaryInput>({
    resolver: zodResolver(AddBeneficiarySchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      type: BeneficiaryType.CHILD,
      bequestType: BequestType.RESIDUAL,
      description: '',
      percentage: undefined,
      cashAmount: undefined,
    },
  });

  const { mutate: addBeneficiary, isPending, error } = useAddBeneficiary(willId, {
    onSuccess: () => {
      form.reset();
      setSelectedBequestType(BequestType.RESIDUAL);
      onClose();
    },
  });

  // Reset conditional fields when bequest type changes
  useEffect(() => {
    if (selectedBequestType !== BequestType.PERCENTAGE) {
      form.setValue('percentage', undefined);
    }
    if (selectedBequestType !== BequestType.CASH_AMOUNT) {
      form.setValue('cashAmount', undefined);
    }
  }, [selectedBequestType, form]);

  const onSubmit = (data: AddBeneficiaryInput) => {
    addBeneficiary(data);
  };

  const handleClose = () => {
    if (!isPending) {
      form.reset();
      setSelectedBequestType(BequestType.RESIDUAL);
      onClose();
    }
  };

  const getBequestHelperText = (type: BequestType): string => {
    switch (type) {
      case BequestType.RESIDUAL:
        return 'Receives a share of everything left after specific bequests and debts are paid.';
      case BequestType.PERCENTAGE:
        return 'Receives a fixed percentage of the total estate value.';
      case BequestType.CASH_AMOUNT:
        return 'Receives a specific amount of money in Kenya Shillings.';
      case BequestType.SPECIFIC_ASSET:
        return 'Receives a particular named asset (land, vehicle, property, etc.).';
      default:
        return '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            Add Beneficiary
          </DialogTitle>
          <DialogDescription>
            Designate who will inherit from your estate and specify what they will receive.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error.message || 'Failed to add beneficiary. Please try again.'}
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            
            {/* IDENTITY SECTION */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Beneficiary Identity
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Legal Name *</FormLabel>
                      <FormControl>
                        <Input 
                          disabled={isPending}
                          placeholder="e.g. Jane Wanjiru Mwangi" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Relationship *</FormLabel>
                      <Select 
                        disabled={isPending}
                        onValueChange={field.onChange} 
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select relationship" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(BeneficiaryType).map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* INHERITANCE CONFIGURATION */}
            <div className="space-y-4 p-4 bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg">
              <h4 className="text-sm font-semibold text-purple-900 uppercase tracking-wide">
                Inheritance Configuration
              </h4>
              
              <FormField
                control={form.control}
                name="bequestType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type of Bequest *</FormLabel>
                    <Select 
                      disabled={isPending}
                      onValueChange={(val) => {
                        field.onChange(val);
                        setSelectedBequestType(val as BequestType);
                      }} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select bequest type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={BequestType.RESIDUAL}>
                          Residual Estate (Everything remaining)
                        </SelectItem>
                        <SelectItem value={BequestType.PERCENTAGE}>
                          Percentage of Estate (%)
                        </SelectItem>
                        <SelectItem value={BequestType.CASH_AMOUNT}>
                          Specific Cash Amount (KES)
                        </SelectItem>
                        <SelectItem value={BequestType.SPECIFIC_ASSET}>
                          Specific Named Asset
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      {getBequestHelperText(field.value)}
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* CONDITIONAL: Percentage Input */}
              {selectedBequestType === BequestType.PERCENTAGE && (
                <FormField
                  control={form.control}
                  name="percentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Percentage Share (%) *</FormLabel>
                      <FormControl>
                        <Input 
                          disabled={isPending}
                          type="number" 
                          min="0" 
                          max="100" 
                          step="0.01"
                          placeholder="e.g. 25.00"
                          {...field} 
                          value={field.value || ''}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)} 
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        Must be between 0 and 100
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* CONDITIONAL: Cash Amount Input */}
              {selectedBequestType === BequestType.CASH_AMOUNT && (
                <FormField
                  control={form.control}
                  name="cashAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cash Amount (KES) *</FormLabel>
                      <FormControl>
                        <Input 
                          disabled={isPending}
                          type="number" 
                          min="0"
                          step="0.01"
                          placeholder="e.g. 500000"
                          {...field} 
                          value={field.value || ''}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)} 
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground">
                        Amount in Kenya Shillings
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Helper for SPECIFIC_ASSET and RESIDUAL */}
              {selectedBequestType === BequestType.SPECIFIC_ASSET && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    For specific assets, describe the asset in detail in the description field below 
                    (e.g., "My land in Kiambu, Title Deed No. IR 12345/67").
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* DESCRIPTION / CLAUSE */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description / Bequest Clause</FormLabel>
                  <FormControl>
                    <Textarea 
                      disabled={isPending}
                      placeholder={
                        selectedBequestType === BequestType.SPECIFIC_ASSET 
                          ? 'e.g., "My land in Kiambu County, Title Deed No. IR 12345/67, to be inherited upon my death."' 
                          : selectedBequestType === BequestType.RESIDUAL
                          ? 'e.g., "To receive an equal share of my residual estate after all debts and specific bequests."'
                          : 'Describe the inheritance terms...'
                      } 
                      className="resize-none min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Provide clear details about what this beneficiary will receive
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                {isPending ? 'Adding...' : 'Add Beneficiary'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};