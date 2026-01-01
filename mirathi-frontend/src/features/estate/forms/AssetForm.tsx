// forms/AssetForm.tsx

import React from 'react';
import { useForm, useWatch, type Control, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarIcon, Loader2, Info } from 'lucide-react';
import { format } from 'date-fns';
import * as z from 'zod';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui';
import { Button } from '@/components/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui';
import { cn } from '@/lib/utils';

import {
  AddAssetRequestSchema,
  AssetType,
  type AddAssetInput,
} from '@/types/estate.types';
import { useAddAsset } from '../estate.api';

// 1. Define Form Type based on Zod INPUT (allows optional fields with defaults)
type AssetFormValues = z.input<typeof AddAssetRequestSchema>;

interface AssetFormProps {
  estateId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const AssetForm: React.FC<AssetFormProps> = ({
  estateId,
  onSuccess,
  onCancel,
}) => {
  const { mutate, isPending } = useAddAsset(estateId);

  // 2. Initialize Form with the relaxed Input Type
  const form = useForm<AssetFormValues>({
    resolver: zodResolver(AddAssetRequestSchema),
    defaultValues: {
      name: '',
      type: AssetType.PERSONAL,
      currentValue: { amount: 0, currency: 'KES' },
      description: '',
      location: '',
      purchaseDate: '',
      // Initialize nested objects to avoid "undefined" errors when switching types
      // even if they are technically optional in the schema.
      landDetails: { acreage: 0, landUse: 'RESIDENTIAL' },
      vehicleDetails: { year: new Date().getFullYear() },
      financialDetails: { currency: 'KES', isJointAccount: false },
      businessDetails: { shareholdingPercentage: 100 },
    },
  });

  // 3. Watch for type changes
  const selectedType = useWatch({ control: form.control, name: 'type' });

  // 4. Handle Submit: Cast data to API Output type
  const onSubmit: SubmitHandler<AssetFormValues> = (data) => {
    // Clone the data so we don't mutate the original form state
    const cleanData = { ...data };

    // Remove irrelevant details based on type.
    // We cast to Record<string, unknown> to satisfy the linter's 'no-explicit-any' rule
    // while still allowing dynamic property deletion.
    if (data.type !== AssetType.LAND) {
        delete (cleanData as Record<string, unknown>).landDetails;
    }
    if (data.type !== AssetType.VEHICLE) {
        delete (cleanData as Record<string, unknown>).vehicleDetails;
    }
    if (data.type !== AssetType.FINANCIAL) {
        delete (cleanData as Record<string, unknown>).financialDetails;
    }
    if (data.type !== AssetType.BUSINESS) {
        delete (cleanData as Record<string, unknown>).businessDetails;
    }

    // Send to API
    mutate(cleanData as AddAssetInput, {
      onSuccess: () => {
        form.reset();
        onSuccess?.();
      },
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
        {/* --- Section 1: Core Information --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="col-span-2 md:col-span-1">
                <FormLabel>Asset Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Family Home, Toyota Camry" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem className="col-span-2 md:col-span-1">
                <FormLabel>Asset Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(AssetType).map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* --- Section 2: Valuation --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <FormField
            control={form.control}
            name="currentValue.amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current Value (Estimate)</FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-500 text-sm">KES</span>
                    <Input 
                        type="number" 
                        className="pl-12" 
                        placeholder="0.00" 
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="purchaseDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Acquisition Date (Optional)</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(new Date(field.value), "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ? new Date(field.value) : undefined}
                      onSelect={(date) => field.onChange(date?.toISOString())}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* --- Section 3: Polymorphic Details --- */}
        <div className="rounded-lg border bg-slate-50 p-4 shadow-sm">
          <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Info className="h-4 w-4 text-blue-500" />
            Specific Details: <span className="text-blue-600">{selectedType}</span>
          </h4>
          
          {selectedType === AssetType.LAND && <LandFields control={form.control} />}
          {selectedType === AssetType.VEHICLE && <VehicleFields control={form.control} />}
          {selectedType === AssetType.FINANCIAL && <FinancialFields control={form.control} />}
          {selectedType === AssetType.BUSINESS && <BusinessFields control={form.control} />}
          
          {/* Default / Fallback fields */}
          {([AssetType.PERSONAL, AssetType.DIGITAL, AssetType.INSURANCE] as string[]).includes(selectedType) && (
            <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Physical Location / Identifier</FormLabel>
                    <FormControl>
                    <Input placeholder="e.g. Master Bedroom Safe" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
          )}

          <div className="mt-4">
            <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Additional Notes</FormLabel>
                    <FormControl>
                    <Textarea placeholder="Any other relevant details..." className="resize-none" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
          </div>
        </div>

        {/* --- Actions --- */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isPending} className="bg-slate-900">
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add Asset
          </Button>
        </div>
      </form>
    </Form>
  );
};

// ----------------------------------------------------------------------------
// Sub-Components with Typed Control
// ----------------------------------------------------------------------------

const LandFields = ({ control }: { control: Control<AssetFormValues> }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <FormField
      control={control}
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
      control={control}
      name="landDetails.landReferenceNumber"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Land Ref. Number</FormLabel>
          <FormControl><Input {...field} /></FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
    <FormField
      control={control}
      name="landDetails.county"
      render={({ field }) => (
        <FormItem>
          <FormLabel>County</FormLabel>
          <FormControl><Input {...field} /></FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
    <FormField
      control={control}
      name="landDetails.acreage"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Acreage</FormLabel>
          <FormControl>
            <Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
    <FormField
      control={control}
      name="landDetails.landUse"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Land Use</FormLabel>
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
      )}
    />
    <FormField
      control={control}
      name="landDetails.registeredOwner"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Registered Owner Name</FormLabel>
          <FormControl><Input {...field} /></FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  </div>
);

const VehicleFields = ({ control }: { control: Control<AssetFormValues> }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <FormField
      control={control}
      name="vehicleDetails.registrationNumber"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Registration (Plate) No.</FormLabel>
          <FormControl><Input className="uppercase" {...field} /></FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
    <FormField
      control={control}
      name="vehicleDetails.chassisNumber"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Chassis Number</FormLabel>
          <FormControl><Input {...field} /></FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
    <FormField
      control={control}
      name="vehicleDetails.make"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Make</FormLabel>
          <FormControl><Input placeholder="e.g. Toyota" {...field} /></FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
    <FormField
      control={control}
      name="vehicleDetails.model"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Model</FormLabel>
          <FormControl><Input placeholder="e.g. Land Cruiser" {...field} /></FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
    <FormField
      control={control}
      name="vehicleDetails.year"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Year of Manufacture</FormLabel>
          <FormControl>
            <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  </div>
);

const FinancialFields = ({ control }: { control: Control<AssetFormValues> }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <FormField
      control={control}
      name="financialDetails.institutionName"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Bank / Institution</FormLabel>
          <FormControl><Input {...field} /></FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
    <FormField
      control={control}
      name="financialDetails.accountNumber"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Account Number</FormLabel>
          <FormControl><Input {...field} /></FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
    <FormField
      control={control}
      name="financialDetails.accountType"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Account Type</FormLabel>
          <FormControl><Input placeholder="e.g. Savings, Fixed Deposit" {...field} /></FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
    <FormField
      control={control}
      name="financialDetails.accountHolderName"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Account Holder Name</FormLabel>
          <FormControl><Input {...field} /></FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  </div>
);

const BusinessFields = ({ control }: { control: Control<AssetFormValues> }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <FormField
      control={control}
      name="businessDetails.businessName"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Registered Business Name</FormLabel>
          <FormControl><Input {...field} /></FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
    <FormField
      control={control}
      name="businessDetails.registrationNumber"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Registration Number</FormLabel>
          <FormControl><Input {...field} /></FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
    <FormField
      control={control}
      name="businessDetails.businessType"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Business Type</FormLabel>
           <Select onValueChange={field.onChange} defaultValue={field.value}>
             <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
             <SelectContent>
                <SelectItem value="SOLE_PROPRIETORSHIP">Sole Proprietorship</SelectItem>
                <SelectItem value="LIMITED_COMPANY">Limited Company</SelectItem>
                <SelectItem value="PARTNERSHIP">Partnership</SelectItem>
             </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
    <FormField
      control={control}
      name="businessDetails.shareholdingPercentage"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Shareholding (%)</FormLabel>
          <FormControl>
             <Input type="number" min="0" max="100" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  </div>
);