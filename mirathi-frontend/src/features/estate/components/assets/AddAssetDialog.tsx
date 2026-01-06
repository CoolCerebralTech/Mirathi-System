import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';

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
  Textarea
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

export const AddAssetDialog: React.FC<AddAssetDialogProps> = ({ isOpen, onClose, estateId }) => {
  // Track category to switch schemas dynamically
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory>(AssetCategory.BANK_ACCOUNT);

  // We use a generic form initially, but validation switches based on state
  // Note: For complex polymorphic forms, we might separate components, but this keeps it contained.
  const getSchema = () => {
    if (selectedCategory === AssetCategory.LAND) return AddLandAssetSchema;
    if (selectedCategory === AssetCategory.VEHICLE) return AddVehicleAssetSchema;
    return AddGenericAssetSchema;
  };

  const form = useForm({
    resolver: zodResolver(getSchema()),
    defaultValues: {
      category: AssetCategory.BANK_ACCOUNT,
      estimatedValue: 0,
      name: '',
      description: '',
      // Land defaults
      landCategory: LandCategory.RESIDENTIAL,
      county: KenyanCounty.NAIROBI,
      // Vehicle defaults
      vehicleCategory: VehicleCategory.PERSONAL_CAR,
    } as any, // 'any' used here only for default values casting to ease polymorphic initialization
  });

  const { mutate: addAsset, isPending } = useAddAsset(estateId, {
    onSuccess: () => {
      form.reset();
      onClose();
    },
  });

  const onSubmit = (data: any) => {
    // Construct the Discriminated Union payload expected by the API hook
    if (data.category === AssetCategory.LAND) {
      addAsset({ type: 'LAND', estateId, data: data as AddLandAssetInput });
    } else if (data.category === AssetCategory.VEHICLE) {
      addAsset({ type: 'VEHICLE', estateId, data: data as AddVehicleAssetInput });
    } else {
      addAsset({ type: 'GENERIC', estateId, data: data as AddGenericAssetInput });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Asset to Inventory</DialogTitle>
          <DialogDescription>
            Record a new asset. For Land and Vehicles, we require specific legal identifiers.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            {/* 1. CATEGORY SELECTION */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Asset Category</FormLabel>
                  <Select 
                    onValueChange={(val) => {
                      field.onChange(val);
                      setSelectedCategory(val as AssetCategory);
                    }} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(AssetCategory).map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat.replace('_', ' ')}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              {/* 2. COMMON FIELDS */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asset Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Equity Bank Savings" {...field} />
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
                    <FormLabel>Estimated Value (KES)</FormLabel>
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
            </div>

            {/* 3. CONDITIONAL FIELDS: LAND */}
            {selectedCategory === AssetCategory.LAND && (
              <div className="space-y-4 p-4 border rounded-md bg-blue-50/50">
                <h4 className="font-medium text-sm text-blue-900">Land Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="titleDeedNumber"
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
                    name="county"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>County</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            {Object.values(KenyanCounty).map(c => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
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
                        <FormLabel>Land Use</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            {Object.values(LandCategory).map(c => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
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
                          <Input type="number" step="0.01" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {/* 4. CONDITIONAL FIELDS: VEHICLE */}
            {selectedCategory === AssetCategory.VEHICLE && (
              <div className="space-y-4 p-4 border rounded-md bg-orange-50/50">
                <h4 className="font-medium text-sm text-orange-900">Vehicle Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="registrationNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number Plate (e.g. KCA 123B)</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="vehicleCategory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vehicle Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            {Object.values(VehicleCategory).map(c => (
                              <SelectItem key={c} value={c}>{c.replace('_', ' ')}</SelectItem>
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
                        <FormLabel>Make (e.g. Toyota)</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="model"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Model (e.g. Fielder)</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description / Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Any additional details..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Asset
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};