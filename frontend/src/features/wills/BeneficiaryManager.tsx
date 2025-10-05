// src/features/wills/BeneficiaryManager.tsx
// ============================================================================
// Beneficiary Manager Component
// ============================================================================
// - The main interface for assigning assets to beneficiaries within a will.
// - Displays a list of current assignments.
// - Provides a form to add a new assignment, using data from the `useAssets`
//   and `useFamilies` hooks to populate dropdowns.
// ============================================================================

import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { useAssets } from '../../hooks/useAssets';
import { useFamilies } from '../../hooks/useFamilies';
import type { Will } from '../../types';
import { Button } from '../../components/ui/Button';
import { TrashIcon } from '@heroicons/react/20/solid';

interface BeneficiaryManagerProps {
    will: Will;
    onAssign: (data: any) => void;
    onRemove: (assignmentId: string) => void;
}

interface FormValues {
    assetId: string;
    beneficiaryId: string;
    sharePercent: number;
}

export const BeneficiaryManager = ({ will, onAssign, onRemove }: BeneficiaryManagerProps) => {
    const { assets } = useAssets(); // Get available assets
    const { families } = useFamilies(); // Get available family members

    // Flatten all members from all families into a single list of potential beneficiaries
    const allFamilyMembers = families.flatMap(f => f.members);

    const { register, handleSubmit, control, reset, formState: { errors, isSubmitting } } = useForm<FormValues>();

    const onSubmit: SubmitHandler<FormValues> = async (data) => {
        // Convert sharePercent to a number
        const formData = { ...data, sharePercent: data.sharePercent ? Number(data.sharePercent) : undefined };
        await onAssign(formData);
        reset(); // Clear the form after submission
    };

    return (
        <div className="mt-8 bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
                <h3 className="text-base font-semibold leading-6 text-gray-900">Beneficiary Assignments</h3>
                
                {/* Form to add a new assignment */}
                <form className="mt-5 sm:flex sm:items-start sm:gap-x-4" onSubmit={handleSubmit(onSubmit)}>
                    <div className="w-full sm:max-w-xs">
                        <label htmlFor="asset" className="sr-only">Asset</label>
                         <Controller
                            name="assetId"
                            control={control}
                            rules={{ required: 'Please select an asset' }}
                            render={({ field }) => (
                                <select {...field} className="block w-full rounded-md border-gray-300">
                                    <option value="">Select an Asset</option>
                                    {assets.map(asset => <option key={asset.id} value={asset.id}>{asset.name}</option>)}
                                </select>
                            )}
                        />
                    </div>
                     <div className="mt-3 sm:mt-0 w-full sm:max-w-xs">
                        <label htmlFor="beneficiary" className="sr-only">Beneficiary</label>
                        <Controller
                            name="beneficiaryId"
                            control={control}
                            rules={{ required: 'Please select a beneficiary' }}
                            render={({ field }) => (
                                <select {...field} className="block w-full rounded-md border-gray-300">
                                    <option value="">Select a Beneficiary</option>
                                    {allFamilyMembers.map(member => <option key={member.userId} value={member.userId}>{member.user.firstName} {member.user.lastName}</option>)}
                                </select>
                            )}
                        />
                    </div>
                     <div className="mt-3 sm:mt-0 w-full sm:max-w-[100px]">
                        <label htmlFor="share" className="sr-only">Share %</label>
                        <input type="number" {...register('sharePercent', { min: 1, max: 100 })} placeholder="Share %" className="block w-full rounded-md border-gray-300"/>
                    </div>
                    <Button type="submit" loading={isSubmitting} className="mt-3 sm:mt-0 !w-auto">Assign</Button>
                </form>
                
                {/* List of existing assignments */}
                <div className="mt-8 flow-root">
                   <ul role="list" className="-my-5 divide-y divide-gray-200">
                        {will.beneficiaryAssignments.map(a => (
                            <li key={a.id} className="py-4 flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <p className="text-sm font-medium text-gray-900">{a.asset.name}</p>
                                    <span className="text-sm text-gray-500">&rarr;</span>
                                    <p className="text-sm text-gray-900">{a.beneficiary.firstName} {a.beneficiary.lastName}</p>
                                    {a.sharePercent && <span className="text-sm font-bold text-indigo-600">({a.sharePercent}%)</span>}
                                </div>
                                <button onClick={() => onRemove(a.id)} className="p-1 text-red-500 hover:text-red-700">
                                    <TrashIcon className="h-5 w-5"/>
                                </button>
                            </li>
                        ))}
                   </ul>
                </div>
            </div>
        </div>
    );
};