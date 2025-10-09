// FILE: src/pages/DocumentsPage.tsx

import { useState } from 'react';
import { PageHeader } from '../components/common/PageHeader';
import { DataTable } from '../components/ui/DataTable';
import { Button } from '../components/ui/Button';
import { UploadCloud } from 'lucide-react';

import { useMyDocuments, useDeleteDocument, useDownloadDocument } from '../features/documents/documents.api';
import { getDocumentColumns } from '../features/documents/components/DocumentsTable';
import { DocumentUploader } from '../features/documents/components/DocumentUploader';

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
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


export function DocumentsPage() {
  const { data: documentsData, isLoading } = useMyDocuments();
  const deleteDocumentMutation = useDeleteDocument();
  const downloadDocumentMutation = useDownloadDocument();

  // State for controlling the Upload modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // State for controlling the Delete confirmation dialog
  const [docToDelete, setDocToDelete] = useState<string | null>(null);

  const handleDelete = (docId: string) => {
    deleteDocumentMutation.mutate(docId, {
      onSuccess: () => {
        toast.success('Document deleted successfully.');
        setDocToDelete(null); // Close the dialog
      },
      onError: (error: any) => {
        toast.error('Deletion Failed', { description: error.message });
      }
    });
  };
  
  const handleDownload = (docId: string) => {
      downloadDocumentMutation.mutate(docId, {
          onError: (error: any) => {
              toast.error('Download Failed', { description: error.message });
          }
      });
  };

  const columns = React.useMemo(() => getDocumentColumns(handleDownload, setDocToDelete), []);

  const documents = documentsData?.data || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Documents"
        description="Your secure vault for all important documents like title deeds, IDs, and more."
        actions={
          <Button onClick={() => setIsModalOpen(true)}>
            <UploadCloud className="mr-2 h-4 w-4" />
            Upload Document
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={documents}
        isLoading={isLoading}
      />

      {/* --- Modals and Dialogs --- */}
      
      {/* Upload Document Modal */}
      <Modal open={isModalOpen} onOpenChange={setIsModalOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Upload a New Document</ModalTitle>
          </ModalHeader>
          <DocumentUploader onSuccess={() => setIsModalOpen(false)} />
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!docToDelete} onOpenChange={() => setDocToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the document. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleDelete(docToDelete!)}>
              Yes, Delete Document
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}