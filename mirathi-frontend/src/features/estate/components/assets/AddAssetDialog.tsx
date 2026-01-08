// ============================================================================
// FILE: AddAssetDialog.tsx
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, AlertCircle } from 'lucide-react';

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
  Checkbox, // Ensure this is exported from your UI components
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

import { useAddAsset } from '../../estate.api';

interface AddAssetDialogProps {
  isOpen: boolean;
  onClose: () => void;
  estateId: string;
}

// Create a union type for form data
type AssetFormData = AddGenericAssetInput | AddLandAssetInput | AddVehicleAssetInput;

// Helper function to get the appropriate schema based on category
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
  // Initialize with GENERIC (e.g., BANK_ACCOUNT) to avoid starting with complex schemas
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory>(
    AssetCategory.BANK_ACCOUNT
  );

  // Define explicit default values for each type to avoid 'undefined' warnings
  const baseDefaultValues = {
    category: AssetCategory.BANK_ACCOUNT,
    name: '',
    description: '',
    estimatedValue: 0,
    isEncumbered: false,
    encumbranceDetails: '',
  };

  const form = useForm<AssetFormData>({
    // Type assertion is safe here because we control the schema mapping
    resolver: zodResolver(getAssetSchema(selectedCategory)) as unknown as Resolver<AssetFormData>,
    mode: 'onChange',
    defaultValues: baseDefaultValues,
  });

  // Handle category switching logic
  useEffect(() => {
    const currentValues = form.getValues();
    
    // Extract values common to all schemas to preserve user input
    const commonValues = {
      name: currentValues.name || '',
      description: currentValues.description || '',
      estimatedValue: currentValues.estimatedValue || 0,
      isEncumbered: currentValues.isEncumbered || false,
      encumbranceDetails: currentValues.encumbranceDetails || '',
    };

    if (selectedCategory === AssetCategory.LAND) {
      // Explicitly type as Land Input
      const landValues: AddLandAssetInput = {
        ...commonValues,
        category: AssetCategory.LAND,
        // Add Land Defaults
        landCategory: LandCategory.RESIDENTIAL,
        county: KenyanCounty.NAIROBI,
        titleDeedNumber: '',
        parcelNumber: '',
        subCounty: '',
        sizeInAcres: 0,
      };
      form.reset(landValues);
    } else if (selectedCategory === AssetCategory.VEHICLE) {
      // Explicitly type as Vehicle Input
      const vehicleValues: AddVehicleAssetInput = {
        ...commonValues,
        category: AssetCategory.VEHICLE,
        // Add Vehicle Defaults
        vehicleCategory: VehicleCategory.PERSONAL_CAR,
        registrationNumber: '',
        make: '',
        model: '',
        year: new Date().getFullYear(),
      };
      form.reset(vehicleValues);
    } else {
      // Explicitly type as Generic Input
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
    // Discriminate based on category to satisfy the API mutation type
    if (data.category === AssetCategory.LAND) {
      addAsset({ 
        type: 'LAND', 
        estateId, 
        data: data as AddLandAssetInput 
      });
    } else if (data.category === AssetCategory.VEHICLE) {
      addAsset({ 
        type: 'VEHICLE', 
        estateId, 
        data: data as AddVehicleAssetInput 
      });
    } else {
      addAsset({ 
        type: 'GENERIC', 
        estateId, 
        data: data as AddGenericAssetInput 
      });
    }
  };

  const handleClose = () => {
    if (!isPending) {
      form.reset(baseDefaultValues);
      setSelectedCategory(AssetCategory.BANK_ACCOUNT);
      onClose();
    }
  };

  // Render Helpers (Identical logic, just checking imports)
  const renderLandFields = () => (
    <div className="space-y-4 p-4 border-2 border-blue-200 rounded-lg bg-blue-50/30">
      <div className="flex items-center gap-2 mb-2">
        <div className="h-1 w-1 rounded-full bg-blue-600" />
        <h4 className="font-semibold text-sm text-blue-900">
          Land Registration Details
        </h4>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="titleDeedNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title Deed Number <span className="text-red-500">*</span></FormLabel>
              <FormControl>
                <Input disabled={isPending} placeholder="e.g. IR 12345/67" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* ... (Other Land Fields remain the same) ... */}
        <FormField
          control={form.control}
          name="parcelNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Parcel Number</FormLabel>
              <FormControl>
                <Input disabled={isPending} placeholder="e.g. NAIROBI/BLOCK123/456" {...field} />
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
                  <SelectTrigger>
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
          name="subCounty"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sub-County</FormLabel>
              <FormControl>
                <Input disabled={isPending} placeholder="e.g. Westlands" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="landCategory"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Land Use Category <span className="text-red-500">*</span></FormLabel>
              <Select 
                disabled={isPending}
                onValueChange={field.onChange} 
                value={field.value as string}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select land use" />
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
    <div className="space-y-4 p-4 border-2 border-orange-200 rounded-lg bg-orange-50/30">
      <div className="flex items-center gap-2 mb-2">
        <div className="h-1 w-1 rounded-full bg-orange-600" />
        <h4 className="font-semibold text-sm text-orange-900">
          Vehicle Registration Details
        </h4>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="registrationNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Registration Number <span className="text-red-500">*</span></FormLabel>
              <FormControl>
                <Input disabled={isPending} placeholder="e.g. KCA 123B" {...field} />
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
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle type" />
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
                <Input disabled={isPending} placeholder="e.g. Toyota" {...field} />
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
                <Input disabled={isPending} placeholder="e.g. Fielder" {...field} />
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
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Asset to Estate Inventory</DialogTitle>
          <DialogDescription>
            Record a new asset. Land and Vehicle assets require additional legal identifiers 
            for compliance with Kenyan succession law.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error.message || 'Failed to add asset. Please try again.'}
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            
            {/* CATEGORY SELECTION */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Asset Category <span className="text-red-500">*</span></FormLabel>
                  <Select 
                    disabled={isPending}
                    onValueChange={(val) => {
                      field.onChange(val);
                      setSelectedCategory(val as AssetCategory);
                    }} 
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select asset category" />
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
                    <FormLabel>Asset Name <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input 
                        disabled={isPending}
                        placeholder="e.g. Equity Bank Savings Account" 
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
                    <FormLabel>Estimated Value (KES) <span className="text-red-500">*</span></FormLabel>
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
                  <FormLabel>Description / Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      disabled={isPending}
                      placeholder="Any relevant details about this asset..."
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
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    {/* Using standard checkbox if Component available, else fallback to input */}
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isPending}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      This asset has encumbrances (loans, liens, or legal claims)
                    </FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Check this if there are outstanding loans or legal claims against this asset
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
                  <FormItem>
                    <FormLabel>Encumbrance Details</FormLabel>
                    <FormControl>
                      <Textarea 
                        disabled={isPending}
                        placeholder="Describe the loan, lien, or legal claim..."
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
                {isPending ? 'Adding Asset...' : 'Add Asset'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};