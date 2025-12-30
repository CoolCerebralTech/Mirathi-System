import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, Car, Landmark, Wallet, Plus, Briefcase } from 'lucide-react';

import { Button } from '../../../components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/Dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '../../../components/ui/Form';
import { Input } from '../../../components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/Select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/Tabs';
import { Textarea } from '../../../components/ui/Textarea';

import { AddAssetRequestSchema, AssetType } from '../estate.types';
import { useAddAsset } from '../estate.api';

interface AddAssetDialogProps {
  estateId: string;
}

export function AddAssetDialog({ estateId }: AddAssetDialogProps) {
  const [open, setOpen] = React.useState(false);
  const { mutate, isPending } = useAddAsset(estateId, {
    onSuccess: () => {
      setOpen(false);
      form.reset();
    }
  });

  const form = useForm({
    resolver: zodResolver(AddAssetRequestSchema),
    defaultValues: {
      name: '',
      type: 'LAND',
      description: '',
      location: '',
      currentValue: { amount: 0, currency: 'KES' },
      // Sub-forms initialized empty
      landDetails: undefined,
      vehicleDetails: undefined,
      financialDetails: undefined,
    },
  });

  const assetType = form.watch('type');

  const onSubmit = (data: any) => {
    // Clean up data before sending: Remove details objects that don't match the selected type
    if (data.type !== 'LAND') delete data.landDetails;
    if (data.type !== 'VEHICLE') delete data.vehicleDetails;
    if (data.type !== 'FINANCIAL') delete data.financialDetails;
    
    mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add Asset
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record New Asset</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* 1. Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asset Name / Alias</FormLabel>
                    <FormControl><Input placeholder="e.g. Karen Family Home" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="LAND"><Building2 className="inline mr-2 h-4 w-4"/> Land / Real Estate</SelectItem>
                        <SelectItem value="VEHICLE"><Car className="inline mr-2 h-4 w-4"/> Vehicle</SelectItem>
                        <SelectItem value="FINANCIAL"><Landmark className="inline mr-2 h-4 w-4"/> Financial Account</SelectItem>
                        <SelectItem value="BUSINESS"><Briefcase className="inline mr-2 h-4 w-4"/> Business Share</SelectItem>
                        <SelectItem value="PERSONAL"><Wallet className="inline mr-2 h-4 w-4"/> Personal Chattels</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>

            {/* 2. Value */}
            <div className="p-4 bg-slate-50 rounded-md border grid grid-cols-2 gap-4">
               <FormField
                  control={form.control}
                  name="currentValue.currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="KES">KES (Kenya Shilling)</SelectItem>
                          <SelectItem value="USD">USD (US Dollar)</SelectItem>
                          <SelectItem value="GBP">GBP (British Pound)</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="currentValue.amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estimated Value</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={e => field.onChange(parseFloat(e.target.value))} 
                        />
                      </FormControl>
                      <FormDescription>Current market value.</FormDescription>
                    </FormItem>
                  )}
                />
            </div>

            {/* 3. Polymorphic Details Section */}
            <div className="border-t pt-4">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Specific Details
              </h3>

              {assetType === 'LAND' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in">
                  <FormField
                    control={form.control}
                    name="landDetails.titleDeedNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title Deed Number</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="landDetails.landReferenceNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>L.R. Number</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="landDetails.county"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>County</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="landDetails.registeredOwner"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Registered Owner (On Deed)</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="landDetails.landUse"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Land Use</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                           <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                           <SelectContent>
                             <SelectItem value="RESIDENTIAL">Residential</SelectItem>
                             <SelectItem value="AGRICULTURAL">Agricultural</SelectItem>
                             <SelectItem value="COMMERCIAL">Commercial</SelectItem>
                           </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="landDetails.acreage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Acreage</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {assetType === 'VEHICLE' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in">
                  <FormField
                    control={form.control}
                    name="vehicleDetails.registrationNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number Plate</FormLabel>
                        <FormControl><Input className="uppercase" placeholder="KAA 123B" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="vehicleDetails.make"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Make</FormLabel>
                        <FormControl><Input placeholder="Toyota" {...field} /></FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="vehicleDetails.model"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Model</FormLabel>
                        <FormControl><Input placeholder="Prado" {...field} /></FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="vehicleDetails.logbookNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Logbook Serial No.</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {assetType === 'FINANCIAL' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in">
                  <FormField
                    control={form.control}
                    name="financialDetails.institutionName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bank / Institution</FormLabel>
                        <FormControl><Input placeholder="e.g. KCB Bank" {...field} /></FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="financialDetails.accountNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Number</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="financialDetails.accountHolderName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Name</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? 'Recording Asset...' : 'Save to Inventory'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}