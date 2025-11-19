// FILE: src/features/admin/components/AdminActionsCell.tsx

import { MoreHorizontal, Check, X, Download } from 'lucide-react';
import { toast } from 'sonner';
import type { TFunction } from 'i18next';

import type { Document } from '../../../types';
import { Button } from '../../../components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../components/ui/DropdownMenu';
import { useDownloadDocumentVersion } from '../../documents/document.api';

interface AdminActionsCellProps {
  doc: Document;
  t: TFunction;
  actions: {
    onVerify: (document: Document) => void;
    onReject: (document: Document) => void;
  };
}

export function AdminActionsCell({ doc, t, actions }: AdminActionsCellProps) {
  const latestVersion = doc.versions[0];
  const { mutate: download } = useDownloadDocumentVersion();

  const handleDownload = () => {
    if (!latestVersion) return;
    toast.info(t('documents:toasts.download_started_toast'));
    download(
      { documentId: doc.id, versionId: latestVersion.id },
      {
        onError: (err) =>
          toast.error(t('documents:toasts.download_failed_toast'), {
            description: err.message,
          }),
      }
    );
  };

  return (
    <div className="text-right">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            <span>{t('documents:actions.download')}</span>
          </DropdownMenuItem>
          {doc.status === 'PENDING_VERIFICATION' && (
            <>
              <DropdownMenuItem
                className="text-green-600 focus:text-green-700"
                onClick={() => actions.onVerify(doc)}
              >
                <Check className="mr-2 h-4 w-4" />
                <span>{t('admin:documents.actions.verify')}</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => actions.onReject(doc)}
              >
                <X className="mr-2 h-4 w-4" />
                <span>{t('admin:documents.actions.reject')}</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
