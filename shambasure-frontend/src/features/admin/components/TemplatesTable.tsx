// FILE: src/features/admin/components/TemplatesTable.tsx (Finalized)

import * as React from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Edit, Trash2, Copy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

import { useTemplates, useDeleteTemplate } from '../templates.api';
import { Template, TemplateQuery } from '../../../types/schemas/templates.schemas'; // UPGRADE: Correct imports
import { NotificationChannel } from '../../../types/schemas/notifications.schemas';
import { extractErrorMessage } from '../../../api/client';

import { DataTable, DataTableColumnHeader } from '../../../components/ui/DataTable';
import { Button } from '../../../components/ui/Button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../../components/ui/DropdownMenu';
import { Badge } from '../../../components/ui/Badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../../components/ui/AlertDialog';

interface TemplatesTableProps {
  filters: Partial<TemplateQuery>;
  onPaginationChange: (updater: any) => void;
  onEdit: (template: Template) => void;
}

export function TemplatesTable({ filters, onPaginationChange, onEdit }: TemplatesTableProps) {
  const { t } = useTranslation(['admin', 'common']);
  const { data, isLoading } = useTemplates(filters);
  const deleteMutation = useDeleteTemplate();

  const [templateToDelete, setTemplateToDelete] = React.useState<Template | null>(null);

  const handleDeleteConfirm = () => {
    if (!templateToDelete) return;
    deleteMutation.mutate(templateToDelete.id, {
      onSuccess: () => {
        toast.success(t('admin:template_deleted_success'));
        setTemplateToDelete(null);
      },
      onError: (error) => toast.error(t('common:error'), { description: extractErrorMessage(error) }),
    });
  };

  const columns: ColumnDef<Template>[] = React.useMemo(() => [
    {
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('admin:template_name')} />,
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      accessorKey: 'channel',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('admin:channel')} />,
      cell: ({ row }) => <Badge variant={row.original.channel === 'EMAIL' ? 'default' : 'secondary'}>{row.original.channel}</Badge>,
    },
    {
      accessorKey: 'updatedAt',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('admin:last_updated')} />,
      cell: ({ row }) => <span>{formatDistanceToNow(new Date(row.getValue('updatedAt')), { addSuffix: true })}</span>,
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const template = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal size={16} /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(template)}><Edit className="mr-2 h-4 w-4" />{t('common:edit')}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(template.id)}><Copy className="mr-2 h-4 w-4" />{t('admin:copy_template_id')}</DropdownMenuItem>
              {/* UPGRADE: Removed "Test Template" as the backend endpoint doesn't exist. */}
              <DropdownMenuItem className="text-destructive" onClick={() => setTemplateToDelete(template)}><Trash2 className="mr-2 h-4 w-4" />{t('common:delete')}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], [t, onEdit]);
  
  const pageCount = data ? Math.ceil(data.total / (filters.limit || 10)) : 0;

  return (
    <>
      <DataTable
        columns={columns}
        data={data?.templates || []} // UPGRADE: Use `data.templates`
        isLoading={isLoading}
        pageCount={pageCount}
        pagination={{ pageIndex: (filters.page || 1) - 1, pageSize: filters.limit || 10 }}
        onPaginationChange={onPaginationChange}
      />
      <AlertDialog open={!!templateToDelete} onOpenChange={() => setTemplateToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>{t('common:are_you_sure')}</AlertDialogTitle><AlertDialogDescription>{t('admin:confirm_delete_template_message', { name: templateToDelete?.name })}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common:cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} disabled={deleteMutation.isPending}>{t('common:delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}