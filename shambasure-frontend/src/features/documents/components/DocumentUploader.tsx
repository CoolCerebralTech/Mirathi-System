// FILE: src/features/documents/components/DocumentUploader.tsx

import * as React from 'react';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDropzone, type FileRejection } from 'react-dropzone';
import { useTranslation } from 'react-i18next';
import { Upload, X, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

import { useUploadDocument } from '../documents.api';
import { useAssets } from '../../assets/assets.api';
import {
  extractErrorMessage,
} from '../../../api/client';
import {
  DocumentTypeSchema,
  UploadDocumentSchema,
  type UploadDocumentFormInput, // 👈 for useForm
  type UploadDocumentInput,     // 👈 for API payload
} from '../../../types';


import { Button } from '../../../components/ui/Button';
import { Label } from '../../../components/ui/Label';
import { Progress } from '../../../components/ui/Progress';
import { Alert, AlertDescription } from '../../../components/ui/Alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/Select';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// TYPE DEFINITIONS & CONSTANTS
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

interface DocumentUploaderProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  maxSizeMB?: number;
}

interface FileWithPreview extends File {
  preview?: string;
}

const MAX_SIZE_MB = 10;
const ACCEPTED_MIME_TYPES = {
  'application/pdf': [],
  'image/jpeg': [],
  'image/png': [],
  'application/msword': [],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [],
};


// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// COMPONENT
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

export function DocumentUploader({
  onSuccess,
  onCancel,
  maxSizeMB = MAX_SIZE_MB,
}: DocumentUploaderProps) {
  const { t } = useTranslation(['documents', 'common', 'validation']);
  const { mutate: uploadDocument, isPending: isUploading } = useUploadDocument();

  const [selectedFile, setSelectedFile] = React.useState<FileWithPreview | null>(null);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [dropzoneError, setDropzoneError] = React.useState<string | null>(null);

  const { data: assetsData, isLoading: isLoadingAssets } = useAssets();
  const userAssets = assetsData?.data ?? [];

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UploadDocumentFormInput>({
    resolver: zodResolver(UploadDocumentSchema),
    defaultValues: {
      documentType: undefined,
      assetId: undefined,
    },
  });

  const onDrop = React.useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      setDropzoneError(null);
      if (fileRejections.length > 0) {
        const rejection = fileRejections[0];
        const { code } = rejection.errors[0];
        if (code === 'file-too-large') {
          setDropzoneError(t('validation:file_too_large', { size: maxSizeMB }));
        } else if (code === 'file-invalid-type') {
          setDropzoneError(t('validation:file_invalid_type'));
        } else {
          setDropzoneError(t('validation:file_rejected'));
        }
        return;
      }

      if (acceptedFiles.length > 0) {
        const file = Object.assign(acceptedFiles[0], {
          preview: URL.createObjectURL(acceptedFiles[0]),
        });
        setSelectedFile(file);
      }
    },
    [t, maxSizeMB],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_MIME_TYPES,
    maxSize: maxSizeMB * 1024 * 1024,
    multiple: false,
  });

  React.useEffect(() => {
    return () => {
      if (selectedFile?.preview) {
        URL.revokeObjectURL(selectedFile.preview);
      }
    };
  }, [selectedFile]);

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setDropzoneError(null);
    setUploadProgress(0);
    reset(); // Reset the metadata form as well
  };

  const onSubmit: SubmitHandler<UploadDocumentFormInput> = (formData) => {
  if (!selectedFile) return;

    // Parse to enforce schema and apply defaults
  const payload: UploadDocumentInput = UploadDocumentSchema.parse(formData);

  uploadDocument(
    { file: selectedFile, metadata: payload, onProgress: setUploadProgress },
    {
      onSuccess: () => {
        toast.success(t('upload_success'));
        setTimeout(() => {
          handleRemoveFile();
          onSuccess?.();
        }, 1500);
      },
      onError: (error) => {
        toast.error(t('upload_failed'), {
          description: extractErrorMessage(error),
        });
        setUploadProgress(0);
        },
      },
    );
  };

  const uploadComplete = uploadProgress === 100;

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  return (
    <div className="space-y-4">
      {dropzoneError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{dropzoneError}</AlertDescription>
        </Alert>
      )}

      {!selectedFile ? (
        <div
          {...getRootProps()}
          className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
            isDragActive ? 'border-primary bg-primary/5' : 'border-input'
          } ${
            dropzoneError ? 'border-destructive' : ''
          } hover:border-primary/50`}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <p className="mb-2 font-medium">
            {isDragActive ? t('drop_file_here') : t('drag_drop_or_click')}
          </p>
          <p className="text-xs text-muted-foreground">
            {t('supported_formats_with_size', { size: maxSizeMB })}
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            {/* --- File Preview --- */}
            <div className="flex items-start gap-4 rounded-lg border p-4">
              <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded bg-muted">
                {selectedFile.type.startsWith('image/') ? (
                  <img
                    src={selectedFile.preview}
                    alt={selectedFile.name}
                    className="h-full w-full rounded object-cover"
                    onLoad={() => {
                      if (selectedFile.preview)
                        URL.revokeObjectURL(selectedFile.preview);
                    }}
                  />
                ) : (
                  <FileText className="h-10 w-10 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="truncate font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                  {!isUploading && (
                    <Button variant="ghost" size="icon" type="button" onClick={handleRemoveFile}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {(isUploading || uploadComplete) && (
                  <div className="mt-2 space-y-1">
                    <Progress value={uploadProgress} className="h-2" />
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        {uploadProgress}% {uploadComplete ? t('complete') : t('uploading')}
                      </span>
                      {uploadComplete && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* --- Metadata Fields --- */}
            {!isUploading && !uploadComplete && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="documentType">{t('document_type')}</Label>
                  <Controller
                    name="documentType"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger id="documentType" aria-invalid={!!errors.documentType}>
                          <SelectValue placeholder={t('select_document_type_placeholder')} />
                        </SelectTrigger>
                        <SelectContent>
                          {DocumentTypeSchema.options.map((type) => (
                            <SelectItem key={type} value={type}>
                              {t(`document_type_options.${type}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.documentType && (
                    <p className="text-sm text-destructive">{errors.documentType.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assetId">{t('link_to_asset_optional')}</Label>
                  <Controller
                    name="assetId"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingAssets}>
                        <SelectTrigger id="assetId">
                          {isLoadingAssets ? <LoadingSpinner size="sm" /> : <SelectValue placeholder={t('select_asset_placeholder')} />}
                        </SelectTrigger>
                        <SelectContent>
                          {userAssets.map((asset) => (
                            <SelectItem key={asset.id} value={asset.id}>
                              {asset.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>
            )}
          </div>

          {/* --- Action Buttons --- */}
          <div className="flex justify-end gap-2 pt-4">
            {onCancel && (
              <Button variant="outline" type="button" onClick={onCancel} disabled={isUploading}>
                {t('common:cancel')}
              </Button>
            )}
            <Button
              type="submit"
              disabled={!selectedFile || isUploading || uploadComplete}
              isLoading={isUploading}
            >
              {uploadComplete ? t('uploaded') : t('upload_document_button')}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}