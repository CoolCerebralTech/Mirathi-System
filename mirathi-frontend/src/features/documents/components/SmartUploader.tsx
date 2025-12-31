// FILE: src/features/documents/components/SmartUploader.tsx

import React, { useState, useCallback } from 'react';
import { useDropzone, type FileRejection } from 'react-dropzone';
import { 
  UploadCloud, 
  FileText, 
  X, 
  CheckCircle2, 
  Loader2,
  AlertTriangle,
  FileCheck
} from 'lucide-react';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import { Button, Progress, Card } from '@/components/ui';

import { useUploadDocument } from '../document.api';
import { 
  DocumentCategoryEnum, 
  type DocumentCategory, 
  type UploadDocumentResponse 
} from '@/types/document.types';

// ============================================================================
// PROPS
// ============================================================================

interface SmartUploaderProps {
  /**
   * The legal category of the document (Required by Backend)
   */
  category: DocumentCategory;

  /**
   * Label displayed to the user (e.g., "Upload Death Certificate")
   */
  label?: string;

  /**
   * Helper text displayed below the label
   */
  description?: string;

  /**
   * Callback when upload is successful - returns the Document ID
   */
  onUploadComplete: (response: UploadDocumentResponse) => void;

  /**
   * Context IDs (Optional - used for linking documents immediately)
   */
  assetId?: string;
  willId?: string;
  identityForUserId?: string;

  /**
   * Estate ID for linking the document to succession case
   */
  estateId?: string;

  /**
   * Is this document critical for succession process?
   */
  isCritical?: boolean;

  /**
   * Additional metadata for the document
   */
  metadata?: Record<string, unknown>;

  /**
   * Accepted file types (default: images and PDFs)
   */
  acceptedFileTypes?: Record<string, string[]>;

  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const SmartUploader: React.FC<SmartUploaderProps> = ({
  category,
  label = "Upload Document",
  description = "Drag & drop or click to upload (PDF, JPG, PNG)",
  onUploadComplete,
  assetId,
  willId,
  identityForUserId,
  estateId,
  isCritical = false,
  metadata = {},
  acceptedFileTypes = {
    'application/pdf': ['.pdf'],
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
  },
  className,
}) => {
  // State
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  
  // API Hook
  const { mutate: upload, isPending } = useUploadDocument();

  // --------------------------------------------------------------------------
  // Handlers
  // --------------------------------------------------------------------------

  const handleUpload = useCallback((fileToUpload: File) => {
    setUploadStatus('uploading');
    setProgress(0);

    // Prepare metadata with estate context
    const documentMetadata = {
      ...metadata,
      estateId,
      uploadedAt: new Date().toISOString(),
      isCriticalForSuccession: isCritical,
    };

    upload(
      {
        file: fileToUpload,
        data: {
          fileName: fileToUpload.name,
          category,
          assetId,
          willId,
          identityForUserId,
          metadata: documentMetadata,
          // Add document number if available from filename
          documentNumber: extractDocumentNumber(fileToUpload.name),
        },
        onProgress: (prog) => setProgress(prog),
      },
      {
        onSuccess: (data) => {
          setUploadStatus('success');
          setProgress(100);
          
          // Success toast based on document type
          if (category === DocumentCategoryEnum.enum.IDENTITY_PROOF) {
            toast.success("Identity document secured. Verifier will check it shortly.");
          } else if (category === DocumentCategoryEnum.enum.LAND_OWNERSHIP) {
            toast.success("Title deed uploaded. This will be verified by our team.");
          } else {
            toast.success("Document scanned and secured.");
          }
          
          onUploadComplete(data);
        },
        onError: (error) => {
          setUploadStatus('error');
          setFile(null);
          setProgress(0);
          
          // Enhanced error messaging
          if (error.message?.includes('size')) {
            toast.error("File too large", { 
              description: "Maximum size is 10MB. Please compress or use a smaller file." 
            });
          } else if (error.message?.includes('type')) {
            toast.error("Invalid file type", { 
              description: "Please upload PDF, JPG, or PNG files only." 
            });
          } else {
            toast.error("Upload failed", { 
              description: "Please check your connection and try again." 
            });
          }
        },
      }
    );
  }, [upload, category, assetId, willId, identityForUserId, estateId, isCritical, metadata, onUploadComplete]);

  // Helper to extract document number from filename
  const extractDocumentNumber = (filename: string): string | undefined => {
    // Try to extract numbers that look like document IDs
    const match = filename.match(/([A-Z0-9]{6,})/);
    return match ? match[1] : undefined;
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Auto-upload on drop for "Smart" feel
      handleUpload(selectedFile);
    }
  }, [handleUpload]);

  const onDropRejected = useCallback((fileRejections: FileRejection[]) => {
    const rejection = fileRejections[0];
    const error = rejection.errors[0];
    
    if (error.code === 'file-too-large') {
      toast.error("File too large", { 
        description: "Maximum size is 10MB. Please compress or use a smaller file." 
      });
    } else if (error.code === 'file-invalid-type') {
      toast.error("Invalid file type", { 
        description: "Please upload PDF, JPG, or PNG files only." 
      });
    } else {
      toast.error(`Cannot upload file: ${error.message}`);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept: acceptedFileTypes,
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB limit
    disabled: uploadStatus === 'uploading' || uploadStatus === 'success',
  });

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
    setUploadStatus('idle');
    setProgress(0);
  };

  // Get category-specific messages
  const getCategoryMessage = () => {
    switch(category) {
      case DocumentCategoryEnum.enum.LAND_OWNERSHIP:
        return "Upload title deed, lease agreement, or survey plan";
      case DocumentCategoryEnum.enum.IDENTITY_PROOF:
        return "Upload National ID, Passport, or Birth Certificate";
      case DocumentCategoryEnum.enum.SUCCESSION_DOCUMENT:
        return "Upload Grant of Probate, Letters of Administration";
      case DocumentCategoryEnum.enum.FINANCIAL_PROOF:
        return "Upload bank statements, share certificates";
      default:
        return description;
    }
  };

  // --------------------------------------------------------------------------
  // Render Logic
  // --------------------------------------------------------------------------

  return (
    <div className={cn("w-full space-y-2", className)}>
      {label && (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              {label}
            </span>
            {isCritical && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                <AlertTriangle className="h-3 w-3" />
                Required
              </span>
            )}
          </div>
          <p className="text-[0.8rem] text-muted-foreground">
            {getCategoryMessage()}
          </p>
        </div>
      )}

      <Card
        {...getRootProps()}
        className={cn(
          "relative flex flex-col items-center justify-center border-2 border-dashed p-6 transition-all duration-200 cursor-pointer hover:bg-muted/50",
          isDragActive && "border-primary bg-primary/5 ring-2 ring-primary/20",
          uploadStatus === 'error' && "border-destructive/50 bg-destructive/5",
          uploadStatus === 'success' && "border-green-500/50 bg-green-50/50",
          isCritical && !file && "border-amber-300 bg-amber-50/30",
          "min-h-[160px]"
        )}
      >
        <input {...getInputProps()} />

        {/* Critical warning when empty */}
        {isCritical && !file && uploadStatus === 'idle' && (
          <div className="absolute -top-2 left-1/2 -translate-x-1/2">
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-3 py-1 text-xs font-medium text-white">
              <AlertTriangle className="h-3 w-3" />
              Required for succession
            </span>
          </div>
        )}

        {/* STATE: IDLE or DRAGGING */}
        {!file && (
          <div className="flex flex-col items-center gap-2 text-center">
            <div className={cn(
              "rounded-full bg-background p-3 shadow-sm",
              isCritical && "bg-amber-50"
            )}>
              <UploadCloud className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="text-sm">
              <span className="font-semibold text-primary">Click to upload</span>
              <span className="text-muted-foreground"> or drag and drop</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Max file size: 10MB • PDF, JPG, PNG
            </p>
            {estateId && (
              <p className="text-xs text-green-600">
                This document will be linked to your succession case
              </p>
            )}
          </div>
        )}

        {/* STATE: UPLOADING or SUCCESS */}
        {file && (
          <div className="flex w-full flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border",
                uploadStatus === 'success' 
                  ? "border-green-200 bg-green-50 text-green-600" 
                  : "bg-background text-muted-foreground"
              )}>
                {uploadStatus === 'success' ? (
                  <FileCheck className="h-6 w-6" />
                ) : uploadStatus === 'uploading' ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <FileText className="h-6 w-6" />
                )}
              </div>
              
              <div className="flex flex-1 flex-col overflow-hidden">
                <span className="truncate text-sm font-medium text-foreground">
                  {file.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB • {category.replace(/_/g, ' ')}
                </span>
              </div>

              {uploadStatus !== 'success' && uploadStatus !== 'uploading' && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={handleRemove}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Progress Bar */}
            {(uploadStatus === 'uploading' || uploadStatus === 'success') && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className={cn(
                    "font-medium",
                    uploadStatus === 'success' ? "text-green-600" : "text-muted-foreground"
                  )}>
                    {uploadStatus === 'success' 
                      ? 'Securely stored and queued for verification' 
                      : 'Encrypting & Uploading...'}
                  </span>
                  <span className="text-muted-foreground">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}
            
            {/* Status messages */}
            {uploadStatus === 'success' && (
              <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-green-800">
                    Document uploaded successfully
                  </p>
                  <p className="text-xs text-green-700">
                    {category === DocumentCategoryEnum.enum.IDENTITY_PROOF
                      ? "Our verifiers will check this ID document within 24 hours"
                      : "Document stored securely. You can now link it to assets."}
                  </p>
                </div>
              </div>
            )}

            {/* Loading Spinner during server processing */}
            {isPending && progress === 100 && uploadStatus !== 'success' && (
               <div className="flex items-center gap-2 text-xs text-amber-600 animate-pulse">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Processing document metadata...</span>
               </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};