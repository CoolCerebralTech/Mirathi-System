import React, { useState, useEffect } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, AlertCircle, MapPin, Car, Briefcase } from 'lucide-react';

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
  Checkbox,
  Alert,
  AlertDescription,
} from '@/components/ui';

import { 
  AssetCategory, 
  LandCategory, 
  VehicleCategory, 
  KenyanCounty,
  AddLandAssetSchema,
  AddVehicleAssetSchema,
  AddGenericAssetSchema,
  type AddLandAssetInput,
  type AddVehicleAssetInput,
  type AddGenericAssetInput
} from '@/types/estate.types';

import { useAddAsset } from '@/api/estate/estate.api';

interface AddAssetDialogProps {
  isOpen: boolean;
  onClose: () => void;
  estateId: string;
}

// Union Type for form data
type AssetFormData = AddGenericAssetInput | AddLandAssetInput | AddVehicleAssetInput;

// Schema Selector Helper
const getAssetSchema = (category: AssetCategory) => {
  switch (category) {
    case AssetCategory.LAND:
      return AddLandAssetSchema;
    case AssetCategory.VEHICLE:
      return AddVehicleAssetSchema;
    default:
      return AddGenericAssetSchema;
  }
};

export const AddAssetDialog: React.FC<AddAssetDialogProps> = ({ 
  isOpen, 
  onClose, 
  estateId 
}) => {
  // Default to Bank Account for generic start
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory>(
    AssetCategory.BANK_ACCOUNT
  );

  // Common Default Values
  const baseDefaultValues = {
    category: AssetCategory.BANK_ACCOUNT,
    name: '',
    description: '',
    estimatedValue: 0,
    isEncumbered: false,
    encumbranceDetails: '',
  };

  const form = useForm<AssetFormData>({
    resolver: zodResolver(getAssetSchema(selectedCategory)) as unknown as Resolver<AssetFormData>,
    mode: 'onChange',
    defaultValues: baseDefaultValues,
  });

  // Dynamic Form Reset when Category Changes
  useEffect(() => {
    const currentValues = form.getValues();
    
    // Preserve common user inputs
    const commonValues = {
      name: currentValues.name || '',
      description: currentValues.description || '',
      estimatedValue: currentValues.estimatedValue || 0,
      isEncumbered: currentValues.isEncumbered || false,
      encumbranceDetails: currentValues.encumbranceDetails || '',
    };

    if (selectedCategory === AssetCategory.LAND) {
      const landValues: AddLandAssetInput = {
        ...commonValues,
        category: AssetCategory.LAND,
        landCategory: LandCategory.RESIDENTIAL,
        county: KenyanCounty.NAIROBI,
        titleDeedNumber: '',
        parcelNumber: '',
        subCounty: '',
        sizeInAcres: 0,
      };
      form.reset(landValues);
    } else if (selectedCategory === AssetCategory.VEHICLE) {
      const vehicleValues: AddVehicleAssetInput = {
        ...commonValues,
        category: AssetCategory.VEHICLE,
        vehicleCategory: VehicleCategory.PERSONAL_CAR,
        registrationNumber: '',
        make: '',
        model: '',
        year: new Date().getFullYear(),
      };
      form.reset(vehicleValues);
    } else {
      const genericValues: AddGenericAssetInput = {
        ...commonValues,
        category: selectedCategory,
      };
      form.reset(genericValues);
    }
  }, [selectedCategory, form]);

  const { mutate: addAsset, isPending, error } = useAddAsset({
    onSuccess: () => {
      handleClose();
    },
  });

  const onSubmit = (data: AssetFormData) => {
    if (data.category === AssetCategory.LAND) {
      addAsset({ type: 'LAND', estateId, data: data as AddLandAssetInput });
    } else if (data.category === AssetCategory.VEHICLE) {
      addAsset({ type: 'VEHICLE', estateId, data: data as AddVehicleAssetInput });
    } else {
      addAsset({ type: 'GENERIC', estateId, data: data as AddGenericAssetInput });
    }
  };

  const handleClose = () => {
    if (!isPending) {
      form.reset(baseDefaultValues);
      setSelectedCategory(AssetCategory.BANK_ACCOUNT);
      onClose();
    }
  };

  // --- Render Helpers ---

  const renderLandFields = () => (
    <div className="space-y-4 p-5 border border-emerald-100 rounded-lg bg-emerald-50/50 animate-in fade-in slide-in-from-top-2">
      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-emerald-100">
        <MapPin className="h-4 w-4 text-emerald-600" />
        <h4 className="font-bold text-sm text-emerald-800 uppercase tracking-wide">
          Land Registry Details
        </h4>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="titleDeedNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title Deed No. <span className="text-red-500">*</span></FormLabel>
              <FormControl>
                <Input disabled={isPending} placeholder="IR 12345/67" className="bg-white" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="parcelNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Parcel Number</FormLabel>
              <FormControl>
                <Input disabled={isPending} placeholder="NAIROBI/BLOCK123/456" className="bg-white" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="county"
          render={({ field }) => (
            <FormItem>
              <FormLabel>County <span className="text-red-500">*</span></FormLabel>
              <Select 
                disabled={isPending}
                onValueChange={field.onChange} 
                value={field.value as string}
              >
                <FormControl>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Select county" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="max-h-[200px]">
                  {Object.values(KenyanCounty).map((county) => (
                    <SelectItem key={county} value={county}>
                      {county.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="landCategory"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Land Use <span className="text-red-500">*</span></FormLabel>
              <Select 
                disabled={isPending}
                onValueChange={field.onChange} 
                value={field.value as string}
              >
                <FormControl>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Select usage" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.values(LandCategory).map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="sizeInAcres"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Size (Acres)</FormLabel>
              <FormControl>
                <Input 
                  disabled={isPending}
                  type="number" 
                  min="0"
                  step="0.01" 
                  placeholder="0.00"
                  className="bg-white"
                  {...field} 
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );

  const renderVehicleFields = () => (
    <div className="space-y-4 p-5 border border-blue-100 rounded-lg bg-blue-50/50 animate-in fade-in slide-in-from-top-2">
      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-blue-100">
        <Car className="h-4 w-4 text-blue-600" />
        <h4 className="font-bold text-sm text-blue-800 uppercase tracking-wide">
          Vehicle Registration
        </h4>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="registrationNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Registration No. <span className="text-red-500">*</span></FormLabel>
              <FormControl>
                <Input disabled={isPending} placeholder="KCA 123B" className="uppercase bg-white" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="vehicleCategory"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vehicle Type <span className="text-red-500">*</span></FormLabel>
              <Select 
                disabled={isPending}
                onValueChange={field.onChange} 
                value={field.value as string}
              >
                <FormControl>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.values(VehicleCategory).map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="make"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Make <span className="text-red-500">*</span></FormLabel>
              <FormControl>
                <Input disabled={isPending} placeholder="e.g. Toyota" className="bg-white" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="model"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Model <span className="text-red-500">*</span></FormLabel>
              <FormControl>
                <Input disabled={isPending} placeholder="e.g. Fielder" className="bg-white" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="year"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Year</FormLabel>
              <FormControl>
                <Input 
                  disabled={isPending}
                  type="number" 
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  placeholder={new Date().getFullYear().toString()}
                  className="bg-white"
                  {...field} 
                  onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#0F3D3E] flex items-center gap-2">
            <Briefcase className="h-5 w-5" /> Add Asset to Inventory
          </DialogTitle>
          <DialogDescription>
            Record a new asset. Certain categories like Land and Vehicles require specific legal identifiers.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error.message || 'Failed to add asset. Please verify the information and try again.'}
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-2">
            
            {/* CATEGORY SELECTION */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Asset Classification <span className="text-red-500">*</span></FormLabel>
                  <Select 
                    disabled={isPending}
                    onValueChange={(val) => {
                      field.onChange(val);
                      setSelectedCategory(val as AssetCategory);
                    }} 
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select classification" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(AssetCategory).map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat.replace(/_/g, ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* COMMON FIELDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asset Name / Title <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input 
                        disabled={isPending}
                        placeholder="e.g. Equity Bank Account" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="estimatedValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimated Market Value (KES) <span className="text-red-500">*</span></FormLabel>
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
            </div>

            {/* DYNAMIC FIELDS */}
            {selectedCategory === AssetCategory.LAND && renderLandFields()}
            {selectedCategory === AssetCategory.VEHICLE && renderVehicleFields()}

            {/* DESCRIPTION */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description / Location Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      disabled={isPending}
                      placeholder="Enter location details, account numbers (masked), or other identifying features..."
                      className="resize-none"
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ENCUMBRANCE */}
            <FormField
              control={form.control}
              name="isEncumbered"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border border-slate-200 p-4 bg-slate-50">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isPending}
                      className="mt-0.5"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="font-semibold text-slate-900">
                      Encumbrance Alert
                    </FormLabel>
                    <p className="text-xs text-slate-500">
                      Check this box if there are outstanding loans, caveats, or legal claims attached to this asset.
                    </p>
                  </div>
                </FormItem>
              )}
            />

            {form.watch('isEncumbered') && (
              <FormField
                control={form.control}
                name="encumbranceDetails"
                render={({ field }) => (
                  <FormItem className="animate-in fade-in slide-in-from-top-1">
                    <FormLabel>Encumbrance Details <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Textarea 
                        disabled={isPending}
                        placeholder="e.g. Mortgaged to KCB Bank, Outstanding Balance KES 500,000"
                        className="resize-none border-red-200 focus:border-red-500 focus:ring-red-200"
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
            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} className="bg-[#0F3D3E] hover:bg-[#0F3D3E]/90 text-white min-w-[120px]">
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isPending ? 'Processing...' : 'Add Asset'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};