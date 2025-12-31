import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { 
    FormField, FormItem, FormLabel, FormControl, FormMessage, Input, 
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '../../../../components/ui';
import { AssetType, type AddAssetInput } from '../../../../types/estate.types';

interface AssetTypeFieldsProps {
  form: UseFormReturn<AddAssetInput>;
  type: AssetType;
}

export const AssetTypeFields: React.FC<AssetTypeFieldsProps> = ({ form, type }) => {
  switch (type) {
    case AssetType.LAND:
      return (
        <div className="grid gap-4 md:grid-cols-2 rounded-lg border p-4 bg-slate-50">
          <div className="col-span-2 font-medium text-sm text-slate-700">Land Registry Details</div>
          
          <FormField control={form.control} name="landDetails.titleDeedNumber" render={({ field }) => (
            <FormItem><FormLabel>Title Deed No.</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          
          <FormField control={form.control} name="landDetails.landReferenceNumber" render={({ field }) => (
            <FormItem><FormLabel>Reference No. (LR)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />

          <FormField control={form.control} name="landDetails.county" render={({ field }) => (
            <FormItem><FormLabel>County</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />

          <FormField control={form.control} name="landDetails.acreage" render={({ field }) => (
             <FormItem><FormLabel>Acreage (Ha)</FormLabel><FormControl><Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} /></FormControl><FormMessage /></FormItem>
          )} />

          <FormField control={form.control} name="landDetails.landUse" render={({ field }) => (
             <FormItem>
                <FormLabel>Current Use</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                        <SelectItem value="RESIDENTIAL">Residential</SelectItem>
                        <SelectItem value="COMMERCIAL">Commercial</SelectItem>
                        <SelectItem value="AGRICULTURAL">Agricultural</SelectItem>
                    </SelectContent>
                </Select>
                <FormMessage />
            </FormItem>
          )} />
          
          <FormField control={form.control} name="landDetails.registeredOwner" render={({ field }) => (
            <FormItem><FormLabel>Registered Owner Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>
      );

    case AssetType.VEHICLE:
        return (
            <div className="grid gap-4 md:grid-cols-2 rounded-lg border p-4 bg-slate-50">
                <div className="col-span-2 font-medium text-sm text-slate-700">Vehicle Details (NTSA)</div>
                <FormField control={form.control} name="vehicleDetails.registrationNumber" render={({ field }) => (
                    <FormItem><FormLabel>Plate Number</FormLabel><FormControl><Input placeholder="KAA 123A" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="vehicleDetails.make" render={({ field }) => (
                    <FormItem><FormLabel>Make (e.g. Toyota)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="vehicleDetails.model" render={({ field }) => (
                    <FormItem><FormLabel>Model</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="vehicleDetails.year" render={({ field }) => (
                    <FormItem><FormLabel>Year</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} /></FormControl><FormMessage /></FormItem>
                )} />
            </div>
        );

    case AssetType.FINANCIAL:
        return (
             <div className="grid gap-4 md:grid-cols-2 rounded-lg border p-4 bg-slate-50">
                <div className="col-span-2 font-medium text-sm text-slate-700">Bank/Financial Details</div>
                <FormField control={form.control} name="financialDetails.institutionName" render={({ field }) => (
                    <FormItem><FormLabel>Bank / Institution</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="financialDetails.accountNumber" render={({ field }) => (
                    <FormItem><FormLabel>Account Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="financialDetails.accountHolderName" render={({ field }) => (
                    <FormItem><FormLabel>Account Holder Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="financialDetails.currency" render={({ field }) => (
                    <FormItem><FormLabel>Currency</FormLabel><FormControl><Input maxLength={3} placeholder="KES" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
             </div>
        );

    default:
      return (
         <div className="p-4 rounded-lg border border-dashed text-center text-sm text-muted-foreground">
            Basic details are sufficient for this asset type.
         </div>
      );
  }
};