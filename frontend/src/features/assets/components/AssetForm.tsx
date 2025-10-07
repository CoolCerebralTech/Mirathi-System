// FILE: src/features/assets/components/AssetForm.tsx

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';

import { CreateAssetSchema, type Asset, type CreateAssetInput } from '../../../types';
import { useCreateAsset, useUpdateAsset } from '../assets.api';

import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import { Textarea } from '../../../components/ui/Textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/Select';
import { toast } from '../../../hooks/useToast';
import { ASSET_TYPES } from '../../../config/constants'; // We'll create this constants file

interface AssetFormProps {
  asset?: Asset | null; // The asset to edit, if any
  onSuccess: () => void; // Function to call on success (e.g., to close a modal)
}

export function AssetForm({ asset, onSuccess }: AssetFormProps) {
  const isEditing = !!asset;
  const createAssetMutation = useCreateAsset();
  const updateAssetMutation = useUpdateAsset();
  
  const mutation = isEditing ? updateAssetMutation : createAssetMutation;

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<CreateAssetInput>({
    resolver: zodResolver(CreateAssetSchema),
    defaultValues: {
        name: '',
        description: '',
        type: 'LAND_PARCEL', // Default value
    },
  });

  // If we are in "edit" mode, populate the form with the asset's data
  useEffect(() => {
    if (isEditing) {
      reset(asset);
    }
  }, [asset, isEditing, reset]);

  const onSubmit = (data: CreateAssetInput) => {
    if (isEditing) {
      updateAssetMutation.mutate({ assetId: asset.id, data }, {
        onSuccess: () => {
          toast.success('Asset updated successfully!');
          onSuccess();
        },
        onError: (error: any) => toast.error('Update Failed', { description: error.message }),
      });
    } else {
      createAssetMutation.mutate(data, {
        onSuccess: () => {
          toast.success('Asset created successfully!');
          onSuccess();
        },
        onError: (error: any) => toast.error('Creation Failed', { description: error.message }),
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Asset Name</Label>
        <Input id="name" {...register('name')} disabled={mutation.isLoading} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Asset Type</Label>
        {/* We use a Controller from react-hook-form to integrate with our custom Select component */}
        <Controller
          control={control}
          name="type"
          render={({ field }) => (
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <SelectTrigger id="type" disabled={mutation.isLoading}>
                <SelectValue placeholder="Select an asset type" />
              </SelectTrigger>
              <SelectContent>
                {ASSET_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                        {type.label}
                    </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.type && <p className="text-sm text-destructive">{errors.type.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          rows={5}
          {...register('description')}
          disabled={mutation.isLoading}
        />
        {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
      </div>
      
      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={mutation.isLoading}>
            {mutation.isLoading ? 'Saving...' : (isEditing ? 'Save Changes' : 'Create Asset')}
        </Button>
      </div>
    </form>
  );
}