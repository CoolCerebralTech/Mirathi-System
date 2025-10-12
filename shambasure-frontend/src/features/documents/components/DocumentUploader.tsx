// FILE: src/features/documents/components/DocumentUploader.tsx

import * as React from 'react';
import { useDropzone } from 'react-dropzone';
import { useTranslation } from 'react-i18next';
import { 
  Upload, 
  X, 
  FileText, 
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

import {  useUploadDocument } from '../documents.api';
import { toast } from 'sonner';
import { extractErrorMessage } from '../../../api/client';

import { Button } from '../../../components/ui/Button';
import { Label } from '../../../components/ui/Label';
import { Input } from '../../../components/ui/Input';
import { Progress } from '../../../components/ui/Progress';
import { Alert, AlertDescription } from '../../../components/ui/Alert';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface DocumentUploaderProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  assetId?: string;
  maxSizeMB?: number;
  acceptedFileTypes?: string[];
}

interface FileWithPreview extends File {
  preview?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_MAX_SIZE_MB = 10;
const DEFAULT_ACCEPTED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/jpg',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

// ============================================================================
// COMPONENT
// ============================================================================

export function DocumentUploader({
  onSuccess,
  onCancel,
  assetId,
  maxSizeMB = DEFAULT_MAX_SIZE_MB,
  acceptedFileTypes = DEFAULT_ACCEPTED_TYPES,
}: DocumentUploaderProps) {
  const { t } = useTranslation(['documents', 'common']);
  const uploadMutation = useUploadDocument();

  const [selectedFile, setSelectedFile] = React.useState<FileWithPreview | null>(null);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [description, setDescription] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  // ============================================================================
  // DROPZONE CONFIGURATION
  // ============================================================================

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    accept: acceptedFileTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxSize: maxSizeMB * 1024 * 1024,
    multiple: false,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0] as FileWithPreview;
        
        // Create preview for images
        if (file.type.startsWith('image/')) {
          file.preview = URL.createObjectURL(file);
        }
        
        setSelectedFile(file);
        setError(null);
      }
    },
  });

  // ============================================================================
  // EFFECTS
  // ============================================================================

  React.useEffect(() => {
    // Handle file rejection errors
    if (fileRejections.length > 0) {
      const rejection = fileRejections[0];
      if (rejection.errors[0]?.code === 'file-too-large') {
        setError(`File is too large. Maximum size is ${maxSizeMB}MB.`);
      } else if (rejection.errors[0]?.code === 'file-invalid-type') {
        setError('Invalid file type. Please upload PDF, images, or Word documents.');
      } else {
        setError(rejection.errors[0]?.message || 'File rejected');
      }
    }
  }, [fileRejections, maxSizeMB]);

  // Cleanup preview URLs
  React.useEffect(() => {
    return () => {
      if (selectedFile?.preview) {
        URL.revokeObjectURL(selectedFile.preview);
      }
    };
  }, [selectedFile]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleUpload = () => {
    if (!selectedFile) return;

    uploadMutation.mutate(
      {
        file: selectedFile,
        onProgress: setUploadProgress,
      },
      {
        onSuccess: () => {
          toast.success(t('documents:upload_success'));
          setTimeout(() => {
            setSelectedFile(null);
            setUploadProgress(0);
            onSuccess?.();
          }, 1500);
        },
        onError: (error) => {
          toast.error(t('common:error'), extractErrorMessage(error));
          setUploadProgress(0);
        },
      }
    );
  };

  const handleRemoveFile = () => {
    if (selectedFile?.preview) {
      URL.revokeObjectURL(selectedFile.preview);
    }
    setSelectedFile(null);
    setError(null);
    setUploadProgress(0);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isUploading = uploadMutation.isPending;
  const uploadComplete = uploadProgress === 100 && !isUploading;

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="space-y-4">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* File Selection Area */}
      {!selectedFile ? (
        <div
          {...getRootProps()}
          className={`
            cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors
            ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
            ${error ? 'border-destructive' : ''}
            hover:border-primary hover:bg-primary/5
          `}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <p className="mb-2 text-sm font-medium">
            {isDragActive ? t('documents:drop_file_here') : t('documents:drag_drop_or_click')}
          </p>
          <p className="text-xs text-muted-foreground">
            {t('documents:supported_formats')}: PDF, JPG, PNG, DOC, DOCX (max {maxSizeMB}MB)
          </p>
        </div>
      ) : (
        /* Selected File Preview */
        <div className="space-y-4">
          <div className="flex items-start gap-4 rounded-lg border p-4">
            {selectedFile.preview ? (
              <img
                src={selectedFile.preview}
                alt="Preview"
                className="h-20 w-20 rounded object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded bg-muted">
                <FileText className="h-10 w-10 text-muted-foreground" />
              </div>
            )}

            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
                {!isUploading && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleRemoveFile}
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Upload Progress */}
              {(isUploading || uploadComplete) && (
                <div className="mt-2 space-y-2">
                  <Progress value={uploadProgress} className="h-2" />
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {uploadProgress}% {uploadComplete ? 'Complete' : 'Uploading'}
                    </span>
                    {uploadComplete && (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Optional Description */}
          {!isUploading && !uploadComplete && (
            <div className="space-y-2">
              <Label htmlFor="description">{t('documents:description_optional')}</Label>
              <Input
                id="description"
                placeholder={t('documents:description_placeholder')}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isUploading}
          >
            {t('common:cancel')}
          </Button>
        )}
        <Button
          onClick={handleUpload}
          disabled={!selectedFile || isUploading || uploadComplete}
          isLoading={isUploading}
        >
          {uploadComplete ? t('documents:uploaded') : t('documents:upload')}
        </Button>
      </div>
    </div>
  );
}