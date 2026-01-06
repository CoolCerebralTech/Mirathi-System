import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
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
  Textarea
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

export const AddBeneficiaryDialog: React.FC<AddBeneficiaryDialogProps> = ({ isOpen, onClose, willId }) => {
  // State to track the selected bequest type for conditional rendering
  const [selectedBequestType, setSelectedBequestType] = useState<BequestType>(BequestType.RESIDUAL);
  
  const form = useForm<AddBeneficiaryInput>({
    resolver: zodResolver(AddBeneficiarySchema),
    defaultValues: {
      name: '',
      type: BeneficiaryType.CHILD,
      bequestType: BequestType.RESIDUAL,
      description: '',
      // Initialize optionals
      percentage: undefined,
      cashAmount: undefined,
    },
  });

  const { mutate: addBeneficiary, isPending } = useAddBeneficiary(willId, {
    onSuccess: () => {
      form.reset();
      setSelectedBequestType(BequestType.RESIDUAL); // Reset local state
      onClose();
    },
  });

  // Watch for external changes if needed, or handle via Select onValueChange
  const onSubmit = (data: AddBeneficiaryInput) => {
    addBeneficiary(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Beneficiary</DialogTitle>
          <DialogDescription>
            Designate who will inherit from your estate.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            {/* 1. IDENTITY SECTION */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Legal Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Jane Wanjiru" {...field} />
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
                    <FormLabel>Relationship</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(BeneficiaryType).map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* 2. INHERITANCE CONFIGURATION */}
            <div className="p-4 bg-slate-50 border rounded-md space-y-4">
              <FormField
                control={form.control}
                name="bequestType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type of Bequest</FormLabel>
                    <Select 
                      onValueChange={(val) => {
                        field.onChange(val);
                        setSelectedBequestType(val as BequestType);
                      }} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={BequestType.RESIDUAL}>
                          Residual (Everything left over)
                        </SelectItem>
                        <SelectItem value={BequestType.PERCENTAGE}>
                          Percentage of Estate (%)
                        </SelectItem>
                        <SelectItem value={BequestType.CASH_AMOUNT}>
                          Specific Cash Amount (KES)
                        </SelectItem>
                        <SelectItem value={BequestType.SPECIFIC_ASSET}>
                          Specific Asset (Item)
                        </SelectItem>
                      </SelectContent>
                    </Select>
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
                      <FormLabel>Percentage Share (%)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          max="100" 
                          step="0.01"
                          placeholder="e.g. 25"
                          {...field} 
                          onChange={e => field.onChange(e.target.valueAsNumber)} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* CONDITIONAL: Cash Input */}
              {selectedBequestType === BequestType.CASH_AMOUNT && (
                <FormField
                  control={form.control}
                  name="cashAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cash Amount (KES)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0"
                          placeholder="e.g. 500000"
                          {...field} 
                          onChange={e => field.onChange(e.target.valueAsNumber)} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* 3. DESCRIPTION / CLAUSE */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description / Clause</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={
                        selectedBequestType === BequestType.SPECIFIC_ASSET 
                          ? "e.g., My land in Kiambu (Title No. 123)" 
                          : "e.g., To receive a share of my residual estate..."
                      } 
                      className="resize-none"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Beneficiary
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};