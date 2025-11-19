import * as React from 'react';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDropzone, type FileRejection } from 'react-dropzone';
import { useTranslation } from 'react-i18next';
import { Upload, X, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

import { useUploadDocument } from '../document.api';
import { useAssets } from '../../assets/assets.api';
import {
  UploadDocumentSchema,
  DocumentCategoryEnum,
  type UploadDocumentInput,
} from '../../../types/document.types';

import { Button } from '../../../components/ui/Button';
import { Label } from '../../../components/ui/Label';
import { Input } from '../../../components/ui/Input';
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

// ============================================================================
// TYPES
// ============================================================================

interface DocumentUploaderProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  maxSizeMB?: number;
}

interface FileWithPreview extends File {
  preview?: string;
}

interface Asset {
  id: string;
  name: string;
  type: string;
  description?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_SIZE_MB = 10;

const ACCEPTED_MIME_TYPES = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
};

const CATEGORY_LABELS: Record<string, string> = {
  LAND_OWNERSHIP: 'Land Ownership',
  IDENTITY_PROOF: 'Identity Proof',
  SUCCESSION_DOCUMENT: 'Succession Document',
  FINANCIAL_PROOF: 'Financial Proof',
  OTHER: 'Other',
};

// ============================================================================
// COMPONENT
// ============================================================================

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
  const userAssets = (assetsData?.data ?? []) as Asset[];

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<UploadDocumentInput>({
    resolver: zodResolver(UploadDocumentSchema),
    defaultValues: {
      fileName: '',
      category: undefined,
      assetId: undefined,
      willId: undefined,
      identityForUserId: undefined,
      documentNumber: '',
      issueDate: undefined,
      expiryDate: undefined,
      issuingAuthority: '',
      isPublic: false,
      metadata: undefined,
    },
  });

  const selectedCategory = watch('category');

  const onDrop = React.useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      setDropzoneError(null);
      
      if (fileRejections.length > 0) {
        const { code } = fileRejections[0].errors[0];
        const errorMessage =
          code === 'file-too-large'
            ? t('validation:file_too_large', { size: maxSizeMB })
            : code === 'file-invalid-type'
            ? t('validation:file_invalid_type')
            : t('validation:file_rejected');
        setDropzoneError(errorMessage);
        return;
      }

      if (acceptedFiles.length > 0) {
        const file = Object.assign(acceptedFiles[0], {
          preview: URL.createObjectURL(acceptedFiles[0]),
        }) as FileWithPreview;
        setSelectedFile(file);
      }
    },
    [t, maxSizeMB]
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
    reset();
  };

  const onSubmit: SubmitHandler<UploadDocumentInput> = (formData) => {
    if (!selectedFile) return;

    const finalPayload: UploadDocumentInput = {
      ...formData,
      fileName: selectedFile.name,
    };

    uploadDocument(
      {
        file: selectedFile,
        data: finalPayload,
        onProgress: setUploadProgress,
      },
      {
        onSuccess: () => {
          toast.success(t('upload_success'));
          setTimeout(() => {
            handleRemoveFile();
            onSuccess?.();
          }, 1500);
        },
        onError: (error) => {
          const errorMessage = error instanceof Error ? error.message : 'Upload failed';
          toast.error(t('upload_failed'), { description: errorMessage });
          setUploadProgress(0);
        },
      }
    );
  };

  const uploadComplete = uploadProgress === 100;

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
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
          } ${dropzoneError ? 'border-destructive' : ''} hover:border-primary/50`}
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
            <div className="flex items-start gap-4 rounded-lg border p-4">
              <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded bg-muted">
                {selectedFile.type.startsWith('image/') ? (
                  <img
                    src={selectedFile.preview}
                    alt={selectedFile.name}
                    className="h-full w-full rounded object-cover"
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
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      onClick={handleRemoveFile}
                    >
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
                      {uploadComplete && (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {!isUploading && !uploadComplete && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="category">
                      {t('category')} <span className="text-destructive">*</span>
                    </Label>
                    <Controller
                      name="category"
                      control={control}
                      render={({ field }) => (
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <SelectTrigger
                            id="category"
                            aria-invalid={!!errors.category}
                          >
                            <SelectValue placeholder={t('select_category_placeholder')} />
                          </SelectTrigger>
                          <SelectContent>
                            {DocumentCategoryEnum.options.map((cat) => (
                              <SelectItem key={cat} value={cat}>
                                {CATEGORY_LABELS[cat] || cat}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.category && (
                      <p className="text-sm text-destructive">
                        {errors.category.message}
                      </p>
                    )}
                  </div>

                  {selectedCategory !== 'IDENTITY_PROOF' && (
                    <div className="space-y-2">
                      <Label htmlFor="assetId">{t('link_to_asset_optional')}</Label>
                      <Controller
                        name="assetId"
                        control={control}
                        render={({ field }) => (
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={isLoadingAssets}
                          >
                            <SelectTrigger id="assetId">
                              {isLoadingAssets ? (
                                <LoadingSpinner size="sm" />
                              ) : (
                                <SelectValue placeholder={t('select_asset_placeholder')} />
                              )}
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">None</SelectItem>
                              {userAssets.map((asset: Asset) => (
                                <SelectItem key={asset.id} value={asset.id}>
                                  {asset.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.assetId && (
                        <p className="text-sm text-destructive">
                          {errors.assetId.message}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="documentNumber">
                      {t('document_number_optional')}
                    </Label>
                    <Controller
                      name="documentNumber"
                      control={control}
                      render={({ field }) => (
                        <Input
                          id="documentNumber"
                          {...field}
                          placeholder="e.g., ID1234567"
                        />
                      )}
                    />
                    {errors.documentNumber && (
                      <p className="text-sm text-destructive">
                        {errors.documentNumber.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="issuingAuthority">
                      {t('issuing_authority_optional')}
                    </Label>
                    <Controller
                      name="issuingAuthority"
                      control={control}
                      render={({ field }) => (
                        <Input
                          id="issuingAuthority"
                          {...field}
                          placeholder="e.g., National Bureau"
                        />
                      )}
                    />
                    {errors.issuingAuthority && (
                      <p className="text-sm text-destructive">
                        {errors.issuingAuthority.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="issueDate">{t('issue_date_optional')}</Label>
                    <Controller
                      name="issueDate"
                      control={control}
                      render={({ field }) => (
                        <Input
                          id="issueDate"
                          type="date"
                          {...field}
                          value={field.value || ''}
                        />
                      )}
                    />
                    {errors.issueDate && (
                      <p className="text-sm text-destructive">
                        {errors.issueDate.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expiryDate">{t('expiry_date_optional')}</Label>
                    <Controller
                      name="expiryDate"
                      control={control}
                      render={({ field }) => (
                        <Input
                          id="expiryDate"
                          type="date"
                          {...field}
                          value={field.value || ''}
                        />
                      )}
                    />
                    {errors.expiryDate && (
                      <p className="text-sm text-destructive">
                        {errors.expiryDate.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            {onCancel && (
              <Button
                variant="outline"
                type="button"
                onClick={onCancel}
                disabled={isUploading}
              >
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