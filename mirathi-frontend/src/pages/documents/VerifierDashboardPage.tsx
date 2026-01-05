// pages/verifier/VerifierDashboardPage.tsx

import React, { useState } from 'react';
import { ShieldCheck, Clock, CheckCircle, XCircle } from 'lucide-react';
import { VerificationQueue } from '@/features/documents/components/verifier/VerificationQueue';
import { DocumentReviewer } from '@/features/documents/components/verifier/DocumentReviewer';
import { usePendingDocuments } from '@/features/documents/document.api';
import type { Document } from '@/types/document.types';

export const VerifierDashboardPage: React.FC = () => {
  const [reviewingDocId, setReviewingDocId] = useState<string | null>(null);
  
  const { data: pendingDocs } = usePendingDocuments();

  const handleReview = (document: Document) => {
    setReviewingDocId(document.id);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-3">
          <ShieldCheck className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Document Verification</h1>
          <p className="text-muted-foreground mt-1">
            Review and verify uploaded documents
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-yellow-600" />
            <div>
              <div className="text-2xl font-bold">{pendingDocs?.length || 0}</div>
              <div className="text-sm text-muted-foreground">Pending Review</div>
            </div>
          </div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div>
              <div className="text-2xl font-bold">24</div>
              <div className="text-sm text-muted-foreground">Verified Today</div>
            </div>
          </div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <XCircle className="h-8 w-8 text-red-600" />
            <div>
              <div className="text-2xl font-bold">3</div>
              <div className="text-sm text-muted-foreground">Rejected Today</div>
            </div>
          </div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-blue-600" />
            <div>
              <div className="text-2xl font-bold">89%</div>
              <div className="text-sm text-muted-foreground">Approval Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Queue */}
      <div className="rounded-lg border p-6">
        <VerificationQueue onReview={handleReview} />
      </div>

      {/* Document Reviewer Modal */}
      <DocumentReviewer
        documentId={reviewingDocId}
        isOpen={!!reviewingDocId}
        onClose={() => setReviewingDocId(null)}
      />
    </div>
  );
};