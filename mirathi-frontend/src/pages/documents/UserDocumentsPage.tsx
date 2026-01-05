import React, { useState } from 'react';
import { Upload } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Button,
} from '@/components/ui';
import { DocumentUploader } from '@/features/documents/components/user/DocumentUploader';
import { DocumentList } from '@/features/documents/components/user/DocumentList';
import { useUserDocuments, useDocumentViewUrl } from '@/features/documents/document.api';
import type { Document } from '@/types/document.types';

export const UserDocumentsPage: React.FC = () => {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null);

  const { data: allDocs } = useUserDocuments();
  const { data: viewUrl } = useDocumentViewUrl(viewingDocument?.id);

  const stats = {
    total: allDocs?.length || 0,
    verified: allDocs?.filter(d => d.status === 'VERIFIED').length || 0,
    pending: allDocs?.filter(d => d.status === 'PENDING_VERIFICATION').length || 0,
    rejected: allDocs?.filter(d => d.status === 'REJECTED').length || 0,
  };

  const handleView = (document: Document) => {
    setViewingDocument(document);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Documents</h1>
          <p className="text-muted-foreground mt-1">
            Manage your uploaded documents and track verification status
          </p>
        </div>
        <Button onClick={() => setIsUploadOpen(true)}>
          <Upload className="mr-2 h-4 w-4" />
          Upload Document
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-lg border p-4">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-sm text-muted-foreground">Total</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-2xl font-bold text-green-600">{stats.verified}</div>
          <div className="text-sm text-muted-foreground">Verified</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          <div className="text-sm text-muted-foreground">Pending</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
          <div className="text-sm text-muted-foreground">Rejected</div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Documents</TabsTrigger>
          <TabsTrigger value="pending">Pending Review</TabsTrigger>
          <TabsTrigger value="verified">Verified</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <DocumentList onView={handleView} />
        </TabsContent>

        <TabsContent value="pending">
          <DocumentList status="PENDING_VERIFICATION" onView={handleView} />
        </TabsContent>

        <TabsContent value="verified">
          <DocumentList status="VERIFIED" onView={handleView} />
        </TabsContent>

        <TabsContent value="rejected">
          <DocumentList status="REJECTED" onView={handleView} />
        </TabsContent>
      </Tabs>

      {/* Upload Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Upload a document for verification. Supported formats: JPG, PNG, PDF (Max 10MB)
            </DialogDescription>
          </DialogHeader>
          <DocumentUploader
            onUploadComplete={() => {
              setIsUploadOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!viewingDocument} onOpenChange={() => setViewingDocument(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{viewingDocument?.documentName}</DialogTitle>
          </DialogHeader>
          {viewUrl && viewingDocument && (
            <div className="space-y-4">
              <div className="aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden">
                {viewingDocument.mimeType?.startsWith('image/') ? (
                  <img
                    src={viewUrl.url}
                    alt={viewingDocument.documentName}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <iframe
                    src={viewUrl.url}
                    className="w-full h-full"
                    title={viewingDocument.documentName}
                  />
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};