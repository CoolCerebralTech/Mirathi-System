// FILE: src/features/documents/components/ActionsCell.tsx
import { MoreHorizontal, Download, Edit, Trash2, Eye, Copy, History } from 'lucide-react';
import { toast } from 'sonner';
import { useDownloadDocumentVersion } from '../documents.api';
import { Button } from '../../../components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../components/ui/DropdownMenu';
import type { Document } from '../../../types';
import type { TFunction } from 'i18next';

interface ActionsCellProps {
  doc: Document;
  t: TFunction;
  actions: {
    onDelete: (documentId: string) => void;
    onEdit?: (document: Document) => void;
    onViewVersions?: (document: Document) => void;
    onPreview?: (document: Document) => void;
  };
}

export function ActionsCell({ doc, t, actions }: ActionsCellProps) {
  const latestVersion = doc.versions[0];
  const { mutate: downloadVersion, isPending } = useDownloadDocumentVersion();

  const handleDownload = () => {
    if (!latestVersion) return;
    toast.info(t('documents:download_started_toast'));
    downloadVersion(
      { documentId: doc.id, versionId: latestVersion.id },
      {
        onError: (error) =>
          toast.error(t('documents:download_failed_toast'), {
            description: error.message,
          }),
      },
    );
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(doc.id);
    toast.success(t('documents:id_copied_toast'));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">{t('documents:actions.open_menu')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        <DropdownMenuLabel>{t('documents:actions.title')}</DropdownMenuLabel>
        {actions.onPreview && (
          <DropdownMenuItem onClick={() => actions.onPreview!(doc)}>
            <Eye className="mr-2 h-4 w-4" />
            <span>{t('documents:actions.preview')}</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={handleDownload} disabled={isPending}>
          <Download className="mr-2 h-4 w-4" />
          <span>{t('documents:actions.download')}</span>
        </DropdownMenuItem>
        {actions.onEdit && (
          <DropdownMenuItem onClick={() => actions.onEdit!(doc)}>
            <Edit className="mr-2 h-4 w-4" />
            <span>{t('documents:actions.edit_details')}</span>
          </DropdownMenuItem>
        )}
        {actions.onViewVersions && doc.versions.length > 1 && (
          <DropdownMenuItem onClick={() => actions.onViewVersions!(doc)}>
            <History className="mr-2 h-4 w-4" />
            <span>
              {t('documents:actions.version_history', {
                count: doc.versions.length,
              })}
            </span>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={handleCopyId}>
          <Copy className="mr-2 h-4 w-4" />
          <span>{t('documents:actions.copy_id')}</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => actions.onDelete(doc.id)}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          <span>{t('common:delete')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
