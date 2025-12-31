// FILE: src/features/documents/components/SmartUploader.tsx

import React, { useState, useCallback } from 'react';
import { useDropzone, type FileRejection } from 'react-dropzone';
import { 
  UploadCloud, 
  FileText, 
  X, 
  CheckCircle2, 
  Loader2 
} from 'lucide-react';
import { toast } from 'sonner';

import { cn } from '../../../lib/utils';
import { Button, Progress, Card } from '../../../components/ui';

import { useUploadDocument } from '../document.api';
import { 
  DocumentCategoryEnum, 
  type DocumentCategory, 
  type UploadDocumentResponse 
} from '../../../types/document.types';

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

    upload(
      {
        file: fileToUpload,
        data: {
          fileName: fileToUpload.name,
          category,
          assetId,
          willId,
          identityForUserId,
        },
        onProgress: (prog) => setProgress(prog),
      },
      {
        onSuccess: (data) => {
          setUploadStatus('success');
          setProgress(100);
          toast.success("Document scanned and secured.");
          onUploadComplete(data);
        },
        onError: () => {
          setUploadStatus('error');
          setFile(null); // Reset to allow retry
          setProgress(0);
        },
      }
    );
  }, [upload, category, assetId, willId, identityForUserId, onUploadComplete]);

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
    toast.error(`Cannot upload file: ${rejection.errors[0].message}`);
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

  // --------------------------------------------------------------------------
  // Render Logic
  // --------------------------------------------------------------------------

  return (
    <div className={cn("w-full space-y-2", className)}>
      {label && (
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {label} {category === DocumentCategoryEnum.enum.IDENTITY_PROOF && <span className="text-red-500">*</span>}
          </span>
          {description && <p className="text-[0.8rem] text-muted-foreground">{description}</p>}
        </div>
      )}

      <Card
        {...getRootProps()}
        className={cn(
          "relative flex flex-col items-center justify-center border-2 border-dashed p-6 transition-all duration-200 cursor-pointer hover:bg-muted/50",
          isDragActive && "border-primary bg-primary/5 ring-2 ring-primary/20",
          uploadStatus === 'error' && "border-destructive/50 bg-destructive/5",
          uploadStatus === 'success' && "border-green-500/50 bg-green-50/50",
          "min-h-[160px]"
        )}
      >
        <input {...getInputProps()} />

        {/* STATE: IDLE or DRAGGING */}
        {!file && (
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="rounded-full bg-background p-3 shadow-sm">
              <UploadCloud className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="text-sm">
              <span className="font-semibold text-primary">Click to upload</span>
              <span className="text-muted-foreground"> or drag and drop</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Max file size: 10MB
            </p>
          </div>
        )}

        {/* STATE: UPLOADING or SUCCESS */}
        {file && (
          <div className="flex w-full flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-background",
                uploadStatus === 'success' ? "border-green-200 text-green-600" : "text-muted-foreground"
              )}>
                {uploadStatus === 'success' ? (
                  <CheckCircle2 className="h-6 w-6" />
                ) : (
                  <FileText className="h-6 w-6" />
                )}
              </div>
              
              <div className="flex flex-1 flex-col overflow-hidden">
                <span className="truncate text-sm font-medium text-foreground">
                  {file.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
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
                    {uploadStatus === 'success' ? 'Securely stored' : 'Encrypting & Uploading...'}
                  </span>
                  <span className="text-muted-foreground">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}
            
            {/* Loading Spinner during server processing */}
            {isPending && progress === 100 && uploadStatus !== 'success' && (
               <div className="flex items-center gap-2 text-xs text-amber-600 animate-pulse">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Verifying document integrity...</span>
               </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};