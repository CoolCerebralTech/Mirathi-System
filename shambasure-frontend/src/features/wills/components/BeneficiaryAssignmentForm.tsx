// FILE: src/features/wills/components/BeneficiaryAssignmentForm.tsx

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { AssignBeneficiarySchema, type AssignBeneficiaryInput } from '../../../types';
import { useAddBeneficiaryAssignment } from '../wills.api';
import { useMyAssets } from '../../assets/assets.api'; // To get a list of assets
import { useMyFamilies } from '../../families/families.api'; // To get a list of beneficiaries

import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/Select';
import { toast } from '../../../hooks/useToast';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';

interface BeneficiaryAssignmentFormProps {
  willId: string;
  onSuccess: () => void;
}

export function BeneficiaryAssignmentForm({ willId, onSuccess }: BeneficiaryAssignmentFormProps) {
  const addAssignmentMutation = useAddBeneficiaryAssignment();
  
  // Fetch data for the form's select/dropdown fields
  const { data: assets, isLoading: assetsLoading } = useMyAssets();
  const { data: families, isLoading: familiesLoading } = useMyFamilies();
  
  // We can flatten the families data to get a simple list of all members.
  const allFamilyMembers = families?.flatMap(family => family.members) || [];

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AssignBeneficiaryInput>({
    resolver: zodResolver(AssignBeneficiarySchema),
  });

  const onSubmit = (data: AssignBeneficiaryInput) => {
    addAssignmentMutation.mutate({ willId, data }, {
      onSuccess: () => {
        toast.success('Beneficiary assigned successfully!');
        onSuccess(); // Close the modal
      },
      onError: (error: any) => {
        toast.error('Assignment Failed', { description: error.message });
      },
    });
  };
  
  const isLoading = assetsLoading || familiesLoading;

  if (isLoading) {
    return <div className="flex justify-center p-8"><LoadingSpinner /></div>;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="assetId">Select Asset</Label>
        <Controller
          name="assetId"
          control={control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <SelectTrigger id="assetId" disabled={addAssignmentMutation.isLoading}>
                <SelectValue placeholder="Choose an asset..." />
              </SelectTrigger>
              <SelectContent>
                {assets?.map(asset => (
                  <SelectItem key={asset.id} value={asset.id}>{asset.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.assetId && <p className="text-sm text-destructive">{errors.assetId.message}</p>}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="beneficiaryId">Select Beneficiary</Label>
        <Controller
          name="beneficiaryId"
          control={control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <SelectTrigger id="beneficiaryId" disabled={addAssignmentMutation.isLoading}>
                <SelectValue placeholder="Choose a family member..." />
              </SelectTrigger>
              <SelectContent>
                {allFamilyMembers.map(member => (
                  <SelectItem key={member.userId} value={member.userId}>
                    {member.user.firstName} {member.user.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.beneficiaryId && <p className="text-sm text-destructive">{errors.beneficiaryId.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="sharePercent">Share Percentage (Optional)</Label>
        <Input
          id="sharePercent"
          type="number"
          min="1"
          max="100"
          placeholder="e.g., 50"
          {...register('sharePercent', { valueAsNumber: true })}
          disabled={addAssignmentMutation.isLoading}
        />
        {errors.sharePercent && <p className="text-sm text-destructive">{errors.sharePercent.message}</p>}
      </div>

      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={addAssignmentMutation.isLoading}>
          {addAssignmentMutation.isLoading ? 'Assigning...' : 'Assign Beneficiary'}
        </Button>
      </div>
    </form>
  );
}