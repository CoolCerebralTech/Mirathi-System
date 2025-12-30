import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { format, formatDistanceToNow } from 'date-fns';
import { Download, Upload, FileText, History, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

import { extractErrorMessage } from '../../../api/client';
import {
  useDocumentVersions,
  useCreateNewVersion,
} from '../document.api';
import {
  type Document,
  type CreateDocumentVersionInput,
} from '../../../types/document.types';

import { Button } from '../../../components/ui/Button';
import { Label } from '../../../components/ui/Label';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { Separator } from '../../../components/ui/Separator';
import { Alert, AlertDescription } from '../../../components/ui/Alert';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface DocumentVersionsProps {
  document: Document;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function DocumentVersions({ document: doc }: DocumentVersionsProps) {
  const { t } = useTranslation(['documents', 'common']);

  // Query configuration
  const versionQuery = React.useMemo(() => ({ 
    page: 1, 
    limit: 50, 
    sortOrder: 'desc' as const 
  }), []);

  const {
    data: versionsData,
    isLoading: isLoadingVersions,
    isError: isVersionError,
  } = useDocumentVersions(doc.id, versionQuery);

  const { mutate: createVersion, isPending: isCreating } = useCreateNewVersion();

  const [isAddingMode, setIsAddingMode] = React.useState(false);
  const [newVersionFile, setNewVersionFile] = React.useState<File | null>(null);
  const [changeNote, setChangeNote] = React.useState('');

  // Handle file download using global DOM document
  const handleDownload = (downloadUrl?: string | null, filename?: string) => {
    if (!downloadUrl) {
      toast.error(t('download_url_missing'));
      return;
    }
    toast.info(t('download_started_toast'));
    
    // Using global document object explicitly
    const link = document.createElement('a');
    link.href = downloadUrl;
    if (filename) {
      link.setAttribute('download', filename);
    }
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setNewVersionFile(e.target.files[0]);
    }
  };

  const handleAddVersion = () => {
    if (!newVersionFile) return;

    const payload: CreateDocumentVersionInput = { changeNote };

    createVersion(
      { docId: doc.id, file: newVersionFile, data: payload },
      {
        onSuccess: () => {
          // Toast is handled in the mutation hook, but we can add specific UI logic here
          setNewVersionFile(null);
          setChangeNote('');
          setIsAddingMode(false);
        },
        onError: (error) => {
          // Toast handled in mutation hook usually, but strictly extracting error here if needed
          console.error(extractErrorMessage(error));
        },
      },
    );
  };

  const latestVersion = doc.latestVersion;
  // Filter out the latest version from the history list to avoid duplication
  const versionHistory = versionsData?.data?.filter(v => v.versionNumber !== latestVersion?.versionNumber) ?? [];

  return (
    <div className="space-y-6">
      {/* --- Current Version Section --- */}
      {latestVersion && (
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
                    date: latestVersion.createdAt 
                      ? format(latestVersion.createdAt, 'PPp') 
                      : t('common:unknown_date'),
                  })}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDownload(latestVersion.downloadUrl, latestVersion.filename)}
            >
              <Download className="mr-2 h-4 w-4" />
              {t('download_latest')}
            </Button>
          </div>
        </div>
      )}

      <Separator />

      {/* --- Add New Version Section --- */}
      <div>
        <h3 className="mb-2 text-lg font-semibold">{t('add_new_version')}</h3>
        {!isAddingMode ? (
          <Button onClick={() => setIsAddingMode(true)} variant="secondary" className="w-full sm:w-auto">
            <Upload className="mr-2 h-4 w-4" />
            {t('upload_new_version')}
          </Button>
        ) : (
          <div className="space-y-4 rounded-lg border p-4 animate-in fade-in slide-in-from-top-2">
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
              <Button variant="outline" onClick={() => setIsAddingMode(false)} disabled={isCreating}>
                {t('common:cancel')}
              </Button>
              <Button onClick={handleAddVersion} disabled={!newVersionFile || isCreating} isLoading={isCreating}>
                {t('upload_version')}
              </Button>
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* --- Version History List --- */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <History className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">{t('version_history')}</h3>
        </div>

        {isLoadingVersions && <LoadingSpinner className="mx-auto py-4" />}
        
        {isVersionError && (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{t('version_history_load_error')}</AlertDescription>
            </Alert>
        )}

        {versionsData && versionHistory.length > 0 && (
          <ul className="space-y-3">
            {versionHistory.map((version) => (
              <li key={version.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium">
                    {t('version_title', { number: version.versionNumber })}
                  </p>
                  <div className="flex flex-col gap-1">
                    <p className="text-sm text-muted-foreground">
                      {version.createdAt 
                        ? t('uploaded_ago', { time: formatDistanceToNow(version.createdAt, { addSuffix: true }) })
                        : t('common:unknown_date')
                      }
                    </p>
                    {version.changeNote && (
                      <p className="text-xs italic text-muted-foreground">"{version.changeNote}"</p>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDownload(version.downloadUrl, version.filename)}
                  title={t('download_version', { version: version.versionNumber })}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
        
        {versionsData && versionHistory.length === 0 && !isLoadingVersions && (
           <div className="py-4 text-center text-sm text-muted-foreground">
             {t('no_previous_versions')}
           </div>
        )}
      </div>
    </div>
  );
}