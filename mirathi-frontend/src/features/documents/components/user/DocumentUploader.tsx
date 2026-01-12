// features/documents/components/user/DocumentUploader.tsx

import React, { useState, useCallback } from 'react';
import { Upload, FileText, X, Loader2, CheckCircle2 } from 'lucide-react';
import { Button, Progress, Alert, AlertDescription } from '@/components/ui';
import { useUploadDocument } from '@/api/documents/document.api';
import { ReferenceDisplay } from '../shared/ReferenceDisplay';
import type { ProcessUploadResponse } from '@/types/document.types';

interface DocumentUploaderProps {
  onUploadComplete?: (result: ProcessUploadResponse) => void;
  className?: string;
}

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  onUploadComplete,
  className,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [documentName, setDocumentName] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<ProcessUploadResponse | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const { mutate: uploadDocument, isPending } = useUploadDocument();

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setDocumentName(selectedFile.name.replace(/\.[^/.]+$/, '')); // Remove extension
      setUploadResult(null);
    }
  };

  // Handle drag & drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      setDocumentName(droppedFile.name.replace(/\.[^/.]+$/, ''));
      setUploadResult(null);
    }
  }, []);

  // Handle upload
  const handleUpload = () => {
    if (!file || !documentName.trim()) return;

    uploadDocument(
      {
        documentName: documentName.trim(),
        file,
        onProgress: setUploadProgress,
      },
      {
        onSuccess: (result) => {
          setUploadResult(result);
          onUploadComplete?.(result);
        },
      }
    );
  };

  // Clear selection
  const handleClear = () => {
    setFile(null);
    setDocumentName('');
    setUploadProgress(0);
    setUploadResult(null);
  };

  // Upload successful
  if (uploadResult?.status === 'PENDING_VERIFICATION') {
    return (
      <div className={`space-y-4 ${className}`}>
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Document uploaded successfully! It's now pending verification.
          </AlertDescription>
        </Alert>

        <ReferenceDisplay
          referenceNumber={uploadResult.referenceNumber}
          referenceType={uploadResult.referenceType}
          ocrConfidence={uploadResult.ocrConfidence}
        />

        <Button onClick={handleClear} variant="outline" className="w-full">
          Upload Another Document
        </Button>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Drag & Drop Zone */}
      {!file && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative rounded-lg border-2 border-dashed p-8 text-center transition-colors
            ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
          `}
        >
          <input
            type="file"
            onChange={handleFileChange}
            accept="image/*,.pdf"
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            disabled={isPending}
          />
          
          <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">Drop file here or click to upload</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Supports: JPG, PNG, PDF (Max 10MB)
          </p>
        </div>
      )}

      {/* File Selected */}
      {file && !uploadResult && (
        <>
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1">
                <FileText className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    value={documentName}
                    onChange={(e) => setDocumentName(e.target.value)}
                    placeholder="Enter document name"
                    className="w-full bg-transparent border-none font-medium text-sm focus:outline-none focus:ring-0"
                    disabled={isPending}
                  />
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {file.name} • {(file.size / 1024).toFixed(0)} KB
                  </p>
                </div>
              </div>
              
              {!isPending && (
                <button
                  onClick={handleClear}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Upload Progress */}
          {isPending && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {uploadProgress < 100 ? 'Uploading...' : 'Processing with OCR...'}
                </span>
                <span className="font-medium">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          {/* Upload Button */}
          <div className="flex gap-2">
            <Button
              onClick={handleUpload}
              disabled={isPending || !documentName.trim()}
              className="flex-1"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Document
                </>
              )}
            </Button>
            
            {!isPending && (
              <Button onClick={handleClear} variant="outline">
                Cancel
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
};