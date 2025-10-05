// src/features/families/CreateFamilyModal.tsx
// ============================================================================
// Create Family Modal Component
// ============================================================================
// - A modal dialog containing a simple form to create a new family group.
// - Calls the `onCreate` function on submission.
// ============================================================================

import { useForm, SubmitHandler } from 'react-hook-form';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

interface CreateFamilyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (name: string) => Promise<void>;
}

interface FormValues {
    name: string;
}

export const CreateFamilyModal = ({ isOpen, onClose, onCreate }: CreateFamilyModalProps) => {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<FormValues>();

    const onSubmit: SubmitHandler<FormValues> = async (data) => {
        try {
            await onCreate(data.name);
            reset();
            onClose();
        } catch (error) {
            console.error("Failed to create family");
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create a New Family Group">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <p className="text-sm text-gray-600">
                    Create a family group (HeirLink™) to easily manage and visualize your heirs for succession planning.
                </p>
                <Input
                    label="Family Name"
                    {...register('name', { required: 'Family name is required' })}
                    error={errors.name?.message}
                />
                <div className="pt-4 flex justify-end gap-x-3">
                    <button type="button" onClick={onClose} className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                        Cancel
                    </button>
                    <Button type="submit" loading={isSubmitting}>
                        Create Family
                    </Button>
                </div>
            </form>
        </Modal>
    );
};