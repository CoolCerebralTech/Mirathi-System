// FILE: src/pages/AssetsPage.tsx

import { useState } from 'react';
import { PageHeader } from '../components/common/PageHeader';
import { DataTable } from '../components/ui/DataTable';
import { Button } from '../components/ui/Button';
import { PlusCircle } from 'lucide-react';

import { useMyAssets, useDeleteAsset } from '../features/assets/assets.api';
import { getAssetColumns } from '../features/assets/components/AssetsTable';
import { AssetForm } from '../features/assets/components/AssetForm';
import type { Asset } from '../types/schemas';

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalTrigger,
} from '../components/common/Modal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/common/AlertDialog';
import { toast } from '../hooks/useToast';


export function AssetsPage() {
  const { data: assetsData, isLoading } = useMyAssets();
  const deleteAssetMutation = useDeleteAsset();

  // State for controlling the Create/Edit Asset modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  
  // State for controlling the Delete confirmation dialog
  const [assetToDelete, setAssetToDelete] = useState<string | null>(null);

  const handleEdit = (asset: Asset) => {
    setSelectedAsset(asset);
    setIsModalOpen(true);
  };
  
  const handleAddNew = () => {
    setSelectedAsset(null); // Ensure we're in "create" mode
    setIsModalOpen(true);
  };

  const handleDelete = (assetId: string) => {
    deleteAssetMutation.mutate(assetId, {
      onSuccess: () => {
        toast.success('Asset deleted successfully.');
        setAssetToDelete(null); // Close the dialog
      },
      onError: (error: any) => {
        toast.error('Deletion Failed', { description: error.message });
      }
    });
  };

  // Memoize the columns to prevent re-creation on every render
  const columns = React.useMemo(() => getAssetColumns(handleEdit, setAssetToDelete), []);

  const assets = assetsData || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Assets"
        description="Manage all your registered assets, including land, vehicles, and properties."
        actions={
          <Button onClick={handleAddNew}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Asset
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={assets}
        isLoading={isLoading}
        // Pagination would be added here if the API supported it
      />

      {/* --- Modals and Dialogs --- */}
      
      {/* Create/Edit Asset Modal */}
      <Modal open={isModalOpen} onOpenChange={setIsModalOpen}>
        {/* We control this modal programmatically, so no ModalTrigger is needed here */}
        <ModalContent>
          <ModalHeader>
            <ModalTitle>{selectedAsset ? 'Edit Asset' : 'Create New Asset'}</ModalTitle>
          </ModalHeader>
          <AssetForm 
            asset={selectedAsset}
            onSuccess={() => setIsModalOpen(false)} 
          />
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!assetToDelete} onOpenChange={() => setAssetToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the asset. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleDelete(assetToDelete!)}>
              Yes, Delete Asset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}