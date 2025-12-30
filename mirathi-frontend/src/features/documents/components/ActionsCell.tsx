import * as React from 'react';
import {
  MoreHorizontal,
  Download,
  Edit,
  Trash2,
  Eye,
  Copy,
  History,
  Share2,
  FileCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import type { TFunction } from 'i18next';

import { apiClient, extractErrorMessage } from '../../../api/client';
import type { Document } from '../../../types/document.types';
import { Button } from '../../../components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../components/ui/DropdownMenu';

// ============================================================================
// TYPES
// ============================================================================

interface ActionsCellProps {
  doc: Document;
  t: TFunction;
  actions: {
    onDelete: (documentId: string) => void;
    onEdit?: (document: Document) => void;
    onViewVersions?: (document: Document) => void;
    onPreview?: (document: Document) => void;
    onShare?: (document: Document) => void;
  };
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DOWNLOAD_ENDPOINT = (id: string) => `/documents/${id}/download`;

// ============================================================================
// COMPONENT
// ============================================================================

export function ActionsCell({ doc, t, actions }: ActionsCellProps) {
  const [isDownloading, setIsDownloading] = React.useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    toast.info(t('documents:download_started'));

    try {
      const response = await apiClient.get(DOWNLOAD_ENDPOINT(doc.id), {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', doc.fileName);
      document.body.appendChild(link);
      link.click();

      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(t('documents:download_complete'));
    } catch (error) {
      toast.error(t('documents:download_failed'), {
        description: extractErrorMessage(error),
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(doc.id);
      toast.success(t('documents:id_copied'));
    } catch {
      toast.error(t('common:copy_failed'));
    }
  };

  const hasMultipleVersions = doc.totalVersions && doc.totalVersions > 1;
  const isVerified = doc.status === 'VERIFIED';
  const canEdit = doc.canEdit ?? doc.permissions?.canEdit ?? false;
  const canDelete = doc.canDelete ?? doc.permissions?.canDelete ?? false;
  const canShare = doc.canShare ?? doc.permissions?.canShare ?? false;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">{t('documents:actions.open_menu')}</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[200px]">
        <DropdownMenuLabel className="truncate" title={doc.fileName}>
          {doc.fileName}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {actions.onPreview && (
          <DropdownMenuItem onClick={() => actions.onPreview!(doc)}>
            <Eye className="mr-2 h-4 w-4" />
            <span>{t('documents:actions.preview')}</span>
          </DropdownMenuItem>
        )}

        <DropdownMenuItem onClick={handleDownload} disabled={isDownloading}>
          <Download className="mr-2 h-4 w-4" />
          <span>
            {isDownloading
              ? t('documents:actions.downloading')
              : t('documents:actions.download')}
          </span>
        </DropdownMenuItem>

        {actions.onEdit && canEdit && (
          <DropdownMenuItem onClick={() => actions.onEdit!(doc)}>
            <Edit className="mr-2 h-4 w-4" />
            <span>{t('documents:actions.edit_details')}</span>
          </DropdownMenuItem>
        )}

        {actions.onShare && canShare && (
          <DropdownMenuItem onClick={() => actions.onShare!(doc)}>
            <Share2 className="mr-2 h-4 w-4" />
            <span>{t('documents:actions.share')}</span>
          </DropdownMenuItem>
        )}

        {actions.onViewVersions && hasMultipleVersions && (
          <DropdownMenuItem onClick={() => actions.onViewVersions!(doc)}>
            <History className="mr-2 h-4 w-4" />
            <span>
              {t('documents:actions.version_history', { count: doc.totalVersions })}
            </span>
          </DropdownMenuItem>
        )}

        <DropdownMenuItem onClick={handleCopyId}>
          <Copy className="mr-2 h-4 w-4" />
          <span>{t('documents:actions.copy_id')}</span>
        </DropdownMenuItem>

        {isVerified && (
          <DropdownMenuItem disabled className="opacity-60">
            <FileCheck className="mr-2 h-4 w-4 text-green-600" />
            <span className="text-green-600">{t('documents:verified')}</span>
          </DropdownMenuItem>
        )}

        {canDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => actions.onDelete(doc.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              <span>{t('common:delete')}</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}