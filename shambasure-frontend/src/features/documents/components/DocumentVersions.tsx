// FILE: src/features/documents/components/DocumentVersions.tsx

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Download, Upload, FileText } from 'lucide-react';

import type { Document } from '../../../types';
import { useAddDocumentVersion, useDownloadDocument } from '../documents.api';
import { toast } from '../../../components/common/Toaster';
import { extractErrorMessage } from '../../../api/client';

import { Button } from '../../../components/ui/Button';
import { Label } from '../../../components/ui/Label';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { Separator } from '../../../components/ui/Separator';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface DocumentVersionsProps {
  document: Document;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function DocumentVersions({ document }: DocumentVersionsProps) {
  const { t } = useTranslation(['documents', 'common']);
  const addVersionMutation = useAddDocumentVersion();
  const downloadMutation = useDownloadDocument();

  const [isAddingVersion, setIsAddingVersion] = React.useState(false);
  const [newVersionFile, setNewVersionFile] = React.useState<File | null>(null);
  const [changeNote, setChangeNote] = React.useState('');

  const handleDownload = (docId: string) => {
    toast.info('Starting download...');
    downloadMutation.mutate(docId, {
        onError: (error) => toast.error('Download failed', { description: error.message }),
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewVersionFile(e.target.files[0]);
    }
  };

  const handleAddVersion = () => {
    if (!newVersionFile) return;

    addVersionMutation.mutate(
      {
        documentId: document.id,
        file: newVersionFile,
        data: { changeNote },
      },
      {
        onSuccess: () => {
          toast.success(t('documents:version_added_success'));
          setNewVersionFile(null);
          setChangeNote('');
          setIsAddingVersion(false);
        },
        onError: (error) => {
          toast.error(t('common:error'), extractErrorMessage(error));
        },
      }
    );
  };

  const sortedVersions = [...document.versions].sort((a, b) => b.versionNumber - a.versionNumber);
  const currentVersion = sortedVersions[0];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 text-lg font-semibold">{t('documents:current_version')}</h3>
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <p className="font-medium">{document.filename}</p>
            <p className="text-sm text-muted-foreground">
              {/* The latest version's details */}
              Version {currentVersion.versionNumber} • {format(new Date(currentVersion.createdAt), 'PPp')}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDownload(document.id)}
            disabled={downloadMutation.isPending}
          >
            <Download className="mr-2 h-4 w-4" />
            {t('documents:download_latest')}
          </Button>
        </div>
      </div>

      <Separator />

      {/* Add New Version */}
      <div>
        <h3 className="mb-4 text-lg font-semibold">{t('documents:add_new_version')}</h3>
        
        {!isAddingVersion ? (
          <Button onClick={() => setIsAddingVersion(true)} variant="outline" className="w-full">
            <Upload className="mr-2 h-4 w-4" />
            {t('documents:upload_new_version')}
          </Button>
        ) : (
          <div className="space-y-4 rounded-lg border p-4">
            <div className="space-y-2">
              <Label htmlFor="version-file">{t('documents:select_file')}</Label>
              <Input
                id="version-file"
                type="file"
                onChange={handleFileSelect}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              />
              {newVersionFile && (
                <p className="text-sm text-muted-foreground">
                  {t('documents:selected')}: {newVersionFile.name}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="change-note">{t('documents:change_note')}</Label>
              <Textarea
                id="change-note"
                placeholder={t('documents:change_note_placeholder')}
                value={changeNote}
                onChange={(e) => setChangeNote(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddingVersion(false);
                  setNewVersionFile(null);
                  setChangeNote('');
                }}
                disabled={addVersionMutation.isPending}
              >
                {t('common:cancel')}
              </Button>
              <Button
                onClick={handleAddVersion}
                disabled={!newVersionFile || addVersionMutation.isPending}
                isLoading={addVersionMutation.isPending}
              >
                {t('documents:upload_version')}
              </Button>
            </div>
          </div>
        )}
      </div>

       {/* Version History (excluding the current version) */}
      {sortedVersions.length > 1 && (
        <>
          <Separator />
          <div>
            <h3 className="mb-4 text-lg font-semibold">{t('documents:version_history')}</h3>
            <div className="space-y-3">
              {sortedVersions.slice(1).map((version) => (
                <div key={version.id} /* ... existing JSX ... */>
                  {/* ... existing version details ... */}
                  <Button
                    variant="ghost"
                    size="sm"
                    // BUG FIX: The backend needs the main document ID and version number for this download
                    // We will need a new API endpoint/hook for downloading specific versions
                    // For now, this is a placeholder for that functionality.
                    onClick={() => alert(`Downloading version ${version.versionNumber} - requires dedicated endpoint`)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}