// FILE: src/features/documents/components/DocumentVersions.tsx

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { format, formatDistanceToNow } from 'date-fns';
import { Download, Upload, FileText, History } from 'lucide-react';
import { toast } from 'sonner';

import type { Document } from '../../../types';
import {
  useAddDocumentVersion,
  useDownloadDocumentVersion,
} from '../documents.api';
import { extractErrorMessage } from '../../../api/client';

import { Button } from '../../../components/ui/Button';
import { Label } from '../../../components/ui/Label';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { Separator } from '../../../components/ui/Separator';

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// TYPE DEFINITIONS
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

interface DocumentVersionsProps {
  document: Document;
}

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// COMPONENT
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

/**
 * A component to display a document's version history and allow uploading new versions.
 */
export function DocumentVersions({ document }: DocumentVersionsProps) {
  const { t } = useTranslation(['documents', 'common']);
  const { mutate: addVersion, isPending: isAdding } = useAddDocumentVersion();
  const { mutate: downloadVersion, isPending: isDownloading } =
    useDownloadDocumentVersion();

  const [isAddingMode, setIsAddingMode] = React.useState(false);
  const [newVersionFile, setNewVersionFile] = React.useState<File | null>(null);
  const [changeNote, setChangeNote] = React.useState('');

  const handleDownload = (versionId: string) => {
    toast.info(t('download_started_toast'));
    downloadVersion(
      { documentId: document.id, versionId },
      {
        onError: (error) =>
          toast.error(t('download_failed_toast'), {
            description: extractErrorMessage(error),
          }),
      },
    );
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setNewVersionFile(e.target.files[0]);
    }
  };

  const handleAddVersion = () => {
    if (!newVersionFile) return;

    addVersion(
      {
        id: document.id,
        file: newVersionFile,
        metadata: {
        documentId: document.id,
        changeNote,
      },
      },
      {
        onSuccess: () => {
          toast.success(t('version_added_success'));
          setNewVersionFile(null);
          setChangeNote('');
          setIsAddingMode(false);
        },
        onError: (error) => {
          toast.error(t('common:error'), {
            description: extractErrorMessage(error),
          });
        },
      },
    );
  };

  // Ensure versions are always sorted from newest to oldest
  const sortedVersions = React.useMemo(
    () =>
      [...document.versions].sort(
        (a, b) => b.versionNumber - a.versionNumber,
      ),
    [document.versions],
  );

  const latestVersion = sortedVersions[0];

  return (
    <div className="space-y-6">
      {/* --- Current Version --- */}
      <div>
        <h3 className="mb-2 text-lg font-semibold">{t('current_version')}</h3>
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="flex items-center gap-4">
            <FileText className="h-8 w-8 flex-shrink-0 text-muted-foreground" />
            <div>
              <p className="font-medium">{latestVersion.filename}</p>
              <p className="text-sm text-muted-foreground">
                {t('version_details', {
                  version: latestVersion.versionNumber,
                  date: format(new Date(latestVersion.createdAt), 'PPp'),
                })}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDownload(latestVersion.id)}
            disabled={isDownloading}
            isLoading={isDownloading}
          >
            <Download className="mr-2 h-4 w-4" />
            {t('download_latest')}
          </Button>
        </div>
      </div>

      <Separator />

      {/* --- Add New Version --- */}
      <div>
        <h3 className="mb-2 text-lg font-semibold">{t('add_new_version')}</h3>
        {!isAddingMode ? (
          <Button onClick={() => setIsAddingMode(true)} variant="secondary" className="w-full">
            <Upload className="mr-2 h-4 w-4" />
            {t('upload_new_version')}
          </Button>
        ) : (
          <div className="space-y-4 rounded-lg border p-4">
            <div className="space-y-2">
              <Label htmlFor="version-file">{t('select_file')}</Label>
              <Input id="version-file" type="file" onChange={handleFileSelect} />
              {newVersionFile && (
                <p className="text-sm text-muted-foreground">
                  {t('selected_file', { name: newVersionFile.name })}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="change-note">{t('change_note_optional')}</Label>
              <Textarea
                id="change-note"
                placeholder={t('change_note_placeholder')}
                value={changeNote}
                onChange={(e) => setChangeNote(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsAddingMode(false)}
                disabled={isAdding}
              >
                {t('common:cancel')}
              </Button>
              <Button
                onClick={handleAddVersion}
                disabled={!newVersionFile || isAdding}
                isLoading={isAdding}
              >
                {t('upload_version')}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* --- Version History --- */}
      {sortedVersions.length > 1 && (
        <>
          <Separator />
          <div>
            <div className="mb-4 flex items-center gap-2">
              <History className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-lg font-semibold">{t('version_history')}</h3>
            </div>
            <ul className="space-y-3">
              {sortedVersions.slice(1).map((version) => (
                <li
                  key={version.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">
                      {t('version_title', { number: version.versionNumber })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t('uploaded_ago', {
                        time: formatDistanceToNow(new Date(version.createdAt), {
                          addSuffix: true,
                        }),
                      })}
                    </p>
                    {version.changeNote && (
                      <p className="mt-1 text-xs italic">"{version.changeNote}"</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDownload(version.id)}
                    disabled={isDownloading}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}