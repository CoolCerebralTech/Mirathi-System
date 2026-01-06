import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Gift, Loader2 } from 'lucide-react';
import { 
  Button, 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
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

// --- DIALOG ---
interface AddBeneficiaryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  willId: string;
}

const AddBeneficiaryDialog: React.FC<AddBeneficiaryDialogProps> = ({ isOpen, onClose, willId }) => {
  const [bequestType, setBequestType] = useState<BequestType>(BequestType.RESIDUAL);
  
  const form = useForm<AddBeneficiaryInput>({
    resolver: zodResolver(AddBeneficiarySchema),
    defaultValues: {
      name: '',
      type: BeneficiaryType.CHILD,
      bequestType: BequestType.RESIDUAL,
      description: '',
      percentage: 0,
    },
  });

  const { mutate: addBen, isPending } = useAddBeneficiary(willId, {
    onSuccess: () => {
      form.reset();
      onClose();
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Beneficiary</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => addBen(data))} className="space-y-4">
            
            {/* Identity */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
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
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {Object.values(BeneficiaryType).map(t => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>

            {/* Bequest Type */}
            <FormField
              control={form.control}
              name="bequestType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Inheritance Type</FormLabel>
                  <Select 
                    onValueChange={(val) => {
                      field.onChange(val);
                      setBequestType(val as BequestType);
                    }} 
                    defaultValue={field.value}
                  >
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value={BequestType.RESIDUAL}>Residual (Everything remaining)</SelectItem>
                      <SelectItem value={BequestType.PERCENTAGE}>Percentage of Estate</SelectItem>
                      <SelectItem value={BequestType.SPECIFIC_ASSET}>Specific Asset</SelectItem>
                      <SelectItem value={BequestType.CASH_AMOUNT}>Cash Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            {/* Conditional Fields */}
            {bequestType === BequestType.PERCENTAGE && (
               <FormField
               control={form.control}
               name="percentage"
               render={({ field }) => (
                 <FormItem>
                   <FormLabel>Percentage (%)</FormLabel>
                   <FormControl>
                     <Input 
                       type="number" 
                       {...field} 
                       onChange={e => field.onChange(Number(e.target.value))} 
                     />
                   </FormControl>
                   <FormMessage />
                 </FormItem>
               )}
             />
            )}

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description / Clause</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder='e.g., "To receive 50% of my residual estate"' 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-2">
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

// --- LIST ---
interface BeneficiaryListProps {
  willId: string;
  beneficiaries: { name: string; type: string; description: string }[];
}

export const BeneficiaryList: React.FC<BeneficiaryListProps> = ({ willId, beneficiaries }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Beneficiaries</h3>
        <Button onClick={() => setIsOpen(true)} variant="outline" size="sm">
          <Plus className="w-4 h-4 mr-2" /> Add Beneficiary
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {beneficiaries.map((b, idx) => (
          <div key={idx} className="flex items-start gap-4 p-3 border rounded-lg bg-card text-card-foreground shadow-sm">
            <div className="p-2 bg-purple-50 rounded-full">
              <Gift className="w-4 h-4 text-purple-600" />
            </div>
            <div className="space-y-1">
              <p className="font-medium leading-none">{b.name} <span className="text-xs text-muted-foreground ml-2">({b.type})</span></p>
              <p className="text-sm text-muted-foreground">{b.description}</p>
            </div>
          </div>
        ))}
        {beneficiaries.length === 0 && (
          <div className="text-center py-6 border border-dashed rounded-lg text-muted-foreground text-sm">
            No beneficiaries added yet.
          </div>
        )}
      </div>

      <AddBeneficiaryDialog isOpen={isOpen} onClose={() => setIsOpen(false)} willId={willId} />
    </div>
  );
};