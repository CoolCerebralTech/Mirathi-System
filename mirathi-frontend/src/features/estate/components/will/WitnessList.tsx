import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, UserCheck, Loader2 } from 'lucide-react';
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
  Checkbox,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Badge
} from '@/components/ui';
import { AddWitnessSchema, type AddWitnessInput } from '@/types/estate.types';
import { useAddWitness } from '../../estate.api';

// --- DIALOG COMPONENT ---
interface AddWitnessDialogProps {
  isOpen: boolean;
  onClose: () => void;
  willId: string;
}

const AddWitnessDialog: React.FC<AddWitnessDialogProps> = ({ isOpen, onClose, willId }) => {
  const form = useForm<AddWitnessInput>({
    resolver: zodResolver(AddWitnessSchema),
    defaultValues: {
      fullName: '',
      nationalId: '',
      email: '',
      isOver18: false as any, // Initial state false, schema enforces true
      isNotBeneficiary: false as any,
    },
  });

  const { mutate: addWitness, isPending } = useAddWitness(willId, {
    onSuccess: () => {
      form.reset();
      onClose();
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nominate Witness</DialogTitle>
          <DialogDescription>
            Kenyan Law requires 2 competent witnesses. They must be present when you sign.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => addWitness(data))} className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Legal Name</FormLabel>
                  <FormControl><Input placeholder="As per ID" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nationalId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>National ID (Optional)</FormLabel>
                    <FormControl><Input placeholder="12345678" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email (Optional)</FormLabel>
                    <FormControl><Input placeholder="witness@email.com" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* LEGAL CONFIRMATIONS (S.13 LSA) */}
            <div className="bg-amber-50 p-4 rounded-md border border-amber-200 space-y-4">
              <h4 className="text-sm font-semibold text-amber-900">Legal Confirmations</h4>
              
              <FormField
                control={form.control}
                name="isOver18"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>This person is over 18 years of age.</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isNotBeneficiary"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        This person is NOT a beneficiary in this will.
                      </FormLabel>
                      <FormMessage className="text-xs" />
                      <p className="text-xs text-muted-foreground mt-1">
                        (Section 13: A witness cannot inherit any property.)
                      </p>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Witness
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

// --- LIST COMPONENT ---
interface WitnessListProps {
  willId: string;
  // We accept the raw HTML/preview data or a parsed list. 
  // For simplicity, assuming we extract witnesses from the preview hook or separate query.
  // Using the API response type directly here:
  witnesses: { name: string; status: string }[];
}

export const WitnessList: React.FC<WitnessListProps> = ({ willId, witnesses }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Witnesses</h3>
          <p className="text-sm text-muted-foreground">Required: 2</p>
        </div>
        <Button onClick={() => setIsOpen(true)} variant="outline" size="sm">
          <Plus className="w-4 h-4 mr-2" /> Add Witness
        </Button>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {witnesses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center py-6 text-muted-foreground">
                  No witnesses nominated yet.
                </TableCell>
              </TableRow>
            ) : (
              witnesses.map((w, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-gray-400" />
                    {w.name}
                  </TableCell>
                  <TableCell>
                    <Badge variant={w.status === 'SIGNED' ? 'default' : 'outline'}>
                      {w.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AddWitnessDialog isOpen={isOpen} onClose={() => setIsOpen(false)} willId={willId} />
    </div>
  );
};