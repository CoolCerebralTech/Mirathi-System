// src/pages/documents/DocumentsPage.tsx
// ============================================================================
// Main Documents Page
// ============================================================================
// - The primary interface for users to manage their uploaded documents.
// - Uses the `useDocuments` hook to handle all data fetching and state management.
// - Assembles the `DocumentListItem` components into a list.
// - Manages the visibility of the `DocumentUpload` modal.
// - Provides a clean, user-friendly layout with a clear call-to-action for uploads.
// ============================================================================

import { useState } from 'react';
import { useDocuments } from '../../hooks/useDocuments';
import { DocumentListItem } from '../../features/documents/DocumentListItem';
import { DocumentUpload } from '../../features/documents/DocumentUpload';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/ui/Button';

export const DocumentsPage = () => {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Use our powerful hook to get everything we need
  const { documents, loading, error, uploadDocument, deleteDocument, downloadDocument } = useDocuments();

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    await uploadDocument(file);
    setIsUploading(false);
    setIsUploadModalOpen(false); // Close modal on success
  };
  
  const renderContent = () => {
    if (loading) {
      return <div className="flex justify-center py-10"><LoadingSpinner /></div>;
    }

    if (error) {
      return <div className="text-center py-10 text-red-500">{error}</div>;
    }

    if (documents.length === 0) {
      return (
        <div className="text-center py-10">
          <h3 className="text-lg font-medium text-gray-900">No documents found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by uploading your first document.
          </p>
        </div>
      );
    }

    return (
      <ul role="list" className="divide-y divide-gray-100">
        {documents.map((doc) => (
          <DocumentListItem
            key={doc.id}
            document={doc}
            onDelete={deleteDocument}
            onDownload={downloadDocument}
          />
        ))}
      </ul>
    );
  };

  return (
    <>
      {/* Page Header */}
      <div className="flex flex-col items-start justify-between gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-center sm:gap-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Documents</h1>
          <p className="mt-2 text-sm text-gray-500">
            Securely store and manage your important land documents.
          </p>
        </div>
        <div className="ml-auto">
          <Button onClick={() => setIsUploadModalOpen(true)}>
            Upload Document
          </Button>
        </div>
      </div>

      {/* Document List */}
      <div className="mt-8 bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
        {renderContent()}
      </div>

      {/* Upload Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => !isUploading && setIsUploadModalOpen(false)} // Prevent closing while uploading
        title="Upload a New Document"
      >
        <DocumentUpload 
          onUpload={handleUpload}
          onClose={() => setIsUploadModalOpen(false)}
          isUploading={isUploading}
        />
      </Modal>
    </>
  );
};