// src/features/documents/DocumentUpload.tsx
// ============================================================================
// Document Upload Component
// ============================================================================
// - Provides a user-friendly drag-and-drop and file selection interface.
// - Manages the selected file state.
// - Triggers the `onUpload` callback when the user confirms the upload.
// ============================================================================

import { useState, type DragEvent } from 'react';
import { ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { Button } from '../../components/ui/Button';

interface DocumentUploadProps {
  onUpload: (file: File) => void;
  onClose: () => void;
  isUploading: boolean;
}

export const DocumentUpload = ({ onUpload, onClose, isUploading }: DocumentUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = () => {
    if (file) {
      onUpload(file);
    }
  };

  return (
    <div className="space-y-4">
      <div
        onDragEnter={() => setIsDragging(true)}
        onDragLeave={() => setIsDragging(false)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className={`mt-2 flex justify-center rounded-lg border border-dashed px-6 py-10 ${
          isDragging ? 'border-indigo-600' : 'border-gray-900/25'
        }`}
      >
        <div className="text-center">
          <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-gray-300" />
          <div className="mt-4 flex text-sm leading-6 text-gray-600">
            <label
              htmlFor="file-upload"
              className="relative cursor-pointer rounded-md bg-white font-semibold text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2 hover:text-indigo-500"
            >
              <span>Upload a file</span>
              <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} />
            </label>
            <p className="pl-1">or drag and drop</p>
          </div>
          <p className="text-xs leading-5 text-gray-600">PDF, PNG, JPG up to 10MB</p>
        </div>
      </div>

      {file && (
        <div className="text-sm text-gray-700">
          <strong>Selected file:</strong> {file.name}
        </div>
      )}

      <div className="pt-4 flex justify-end gap-x-3">
        <button onClick={onClose} disabled={isUploading} className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
            Cancel
        </button>
        <Button onClick={handleSubmit} loading={isUploading} disabled={!file}>
          Upload File
        </Button>
      </div>
    </div>
  );
};