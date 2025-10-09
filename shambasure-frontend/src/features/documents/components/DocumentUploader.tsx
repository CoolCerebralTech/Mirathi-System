// FILE: src/features/documents/components/DocumentUploader.tsx

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, File as FileIcon, X } from 'lucide-react';

import { useUploadDocument } from '../documents.api';
import { toast } from '../../../hooks/useToast';
import { Button } from '../../../components/ui/Button';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';

interface DocumentUploaderProps {
  onSuccess: () => void; // To close the modal
}

export function DocumentUploader({ onSuccess }: DocumentUploaderProps) {
  const uploadMutation = useUploadDocument();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) {
      toast.error('No valid file selected.');
      return;
    }
    const file = acceptedFiles[0];
    
    uploadMutation.mutate(file, {
      onSuccess: () => {
        toast.success('Document uploaded successfully!');
        onSuccess();
      },
      onError: (error: any) => {
        toast.error('Upload Failed', { description: error.message });
      }
    });
  }, [uploadMutation, onSuccess]);

  const { getRootProps, getInputProps, isDragActive, acceptedFiles, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/png': ['.png'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
  });
  
  const isFileSelected = acceptedFiles.length > 0;

  return (
    <div className="space-y-4">
      {/* The Dropzone */}
      {!isFileSelected && (
        <div
          {...getRootProps()}
          className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
            isDragActive ? 'border-primary bg-primary/10' : 'hover:border-primary/50'
          }`}
        >
          <input {...getInputProps()} />
          <UploadCloud className="w-10 h-10 text-muted-foreground mb-4" />
          <p className="font-semibold">Drag & drop a file here, or click to select</p>
          <p className="text-sm text-muted-foreground">PDF, PNG, JPG up to 10MB</p>
        </div>
      )}
      
      {/* File Preview */}
      {isFileSelected && (
        <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-4">
                <FileIcon className="h-8 w-8 text-muted-foreground" />
                <div>
                    <p className="font-medium">{acceptedFiles[0].name}</p>
                    <p className="text-sm text-muted-foreground">{Math.round(acceptedFiles[0].size / 1024)} KB</p>
                </div>
            </div>
             {/* This button would clear the selection, a feature for a more advanced version */}
            <Button variant="ghost" size="icon" disabled={uploadMutation.isLoading}>
                <X className="h-4 w-4" />
            </Button>
        </div>
      )}
      
      {fileRejections.length > 0 && (
          <p className="text-sm text-destructive">File rejected: {fileRejections[0].errors[0].message}</p>
      )}

      {/* Upload Button */}
      {uploadMutation.isLoading && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pt-4">
              <LoadingSpinner size="sm" />
              <span>Uploading...</span>
          </div>
      )}
    </div>
  );
}