import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Gift, Percent, Plus, Trash2 } from 'lucide-react';

import { Button } from '../../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/Dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../../../components/ui/Form';
import { Input } from '../../../components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/Select';
import { Badge } from '../../../components/ui/Badge';

import { AddBeneficiaryRequestSchema, BequestType } from '../will.types';
import { useAddBeneficiary } from '../will.api';

interface BequestManagerProps {
  willId: string;
  bequests: Array<{ id: string; beneficiaryName: string; description: string; type: string }>;
}

export function BequestManager({ willId, bequests }: BequestManagerProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">Distribution & Bequests</CardTitle>
        <AddBequestDialog willId={willId} />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {bequests.length === 0 && (
            <p className="text-sm text-muted-foreground italic py-4 text-center">
              No beneficiaries added yet.
            </p>
          )}
          {bequests.map((b) => (
            <div key={b.id} className="flex items-center justify-between p-3 border rounded-md bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="bg-white p-2 rounded-full border">
                  {b.type === 'PERCENTAGE' || b.type === 'RESIDUARY' ? <Percent className="h-4 w-4 text-blue-600" /> : <Gift className="h-4 w-4 text-pink-600" />}
                </div>
                <div>
                  <p className="font-medium text-sm">{b.beneficiaryName}</p>
                  <p className="text-xs text-muted-foreground">{b.description}</p>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px]">{b.type.replace('_', ' ')}</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Sub-component: Form Dialog
function AddBequestDialog({ willId }: { willId: string }) {
  const [open, setOpen] = React.useState(false);
  const { mutate, isPending } = useAddBeneficiary(willId, { onSuccess: () => setOpen(false) });

  const form = useForm({
    resolver: zodResolver(AddBeneficiaryRequestSchema),
    defaultValues: {
      beneficiary: { type: 'EXTERNAL', externalName: '' },
      description: '',
      bequestType: 'SPECIFIC_ASSET',
      percentage: undefined,
      residuaryShare: undefined,
    }
  });

  const type = form.watch('bequestType');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline"><Plus className="mr-2 h-4 w-4" /> Add Bequest</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Beneficiary</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(mutate)} className="space-y-4">
            
            {/* Beneficiary Identity */}
            <FormField
              control={form.control}
              name="beneficiary.externalName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Beneficiary Name</FormLabel>
                  <FormControl><Input placeholder="Full Legal Name" {...field} /></FormControl>
                </FormItem>
              )}
            />

            {/* Bequest Type */}
            <FormField
              control={form.control}
              name="bequestType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type of Gift</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="SPECIFIC_ASSET">Specific Asset (e.g. House)</SelectItem>
                      <SelectItem value="FIXED_AMOUNT">Fixed Cash Amount</SelectItem>
                      <SelectItem value="PERCENTAGE">Percentage of Estate</SelectItem>
                      <SelectItem value="RESIDUARY">Residuary (Everything remaining)</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            {/* Conditional Fields */}
            {type === 'PERCENTAGE' && (
               <FormField
                control={form.control}
                name="percentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Percentage (%)</FormLabel>
                    <FormControl><Input type="number" step="0.01" max="100" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} /></FormControl>
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl><Input placeholder="e.g. My Title Deed No. IR12345..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isPending}>Save Bequest</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}