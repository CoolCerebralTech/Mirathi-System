// src/features/assets/AssetFormModal.tsx
// ============================================================================
// Asset Form Modal Component
// ============================================================================
// - A modal dialog containing a form for creating or editing an asset.
// - It can be in either "create" or "edit" mode, determined by the `assetToEdit` prop.
// - Manages form state and validation using `react-hook-form`.
// - Calls the appropriate save function (`onCreate` or `onUpdate`) on submit.
// ============================================================================

import { useForm, SubmitHandler } from 'react-hook-form';
import { useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import type { Asset, CreateAssetRequest, UpdateAssetRequest, AssetType } from '../../types';

interface AssetFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: CreateAssetRequest | UpdateAssetRequest, assetId?: string) => Promise<void>;
    assetToEdit?: Asset | null;
}

// Asset types for the form's select dropdown
const assetTypes: AssetType[] = ['LAND_PARCEL', 'BANK_ACCOUNT', 'VEHICLE', 'PROPERTY', 'OTHER'];

export const AssetFormModal = ({ isOpen, onClose, onSave, assetToEdit }: AssetFormModalProps) => {
    const isEditMode = !!assetToEdit;
    
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<CreateAssetRequest>();

    // Pre-fill the form with asset data when in edit mode
    useEffect(() => {
        if (isEditMode) {
            reset(assetToEdit);
        } else {
            reset({
                name: '',
                description: '',
                type: 'LAND_PARCEL',
            });
        }
    }, [assetToEdit, isEditMode, reset, isOpen]);

    const onSubmit: SubmitHandler<CreateAssetRequest> = async (data) => {
        try {
            await onSave(data, assetToEdit?.id);
            onClose(); // Close modal on successful save
        } catch (error) {
            // Error is handled by the hook's toast, but we keep the modal open
            console.error("Failed to save asset");
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditMode ? 'Edit Asset' : 'Create New Asset'}
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                    label="Asset Name"
                    {...register('name', { required: 'Asset name is required' })}
                    error={errors.name?.message}
                />
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                        Description
                    </label>
                    <textarea
                        id="description"
                        rows={3}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        {...register('description')}
                    />
                </div>
                 <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                        Asset Type
                    </label>
                    <select
                        id="type"
                        className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                        {...register('type', { required: 'Asset type is required' })}
                    >
                        {assetTypes.map(type => (
                            <option key={type} value={type}>
                                {type.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="pt-4 flex justify-end gap-x-3">
                    <button type="button" onClick={onClose} disabled={isSubmitting} className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                        Cancel
                    </button>
                    <Button type="submit" loading={isSubmitting}>
                        {isEditMode ? 'Save Changes' : 'Create Asset'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};