// FILE: src/features/admin/components/TemplatesTable.tsx

import * as React from 'react';
import type { ColumnDef } from '@tantml:react-table';
import { MoreHorizontal, Edit, Trash2, Send, Copy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';

import { 
  useTemplates, 
  useDeleteTemplate,
  useTestTemplate 
} from '../templates.api';
import type { NotificationTemplate, TemplateQuery, NotificationChannel } from '../../../types';
import { toast } from '../../../components/common/Toaster';
import { extractErrorMessage } from '../../../api/client';

import { DataTable, DataTableColumnHeader } from '../../../components/ui/DataTable';
import { Button } from '../../../components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../components/ui/DropdownMenu';
import { Badge } from '../../../components/ui/Badge';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface TemplatesTableProps {
  filters: TemplateQuery;
  onFiltersChange: (filters: TemplateQuery) => void;
  onEditTemplate?: (template: NotificationTemplate) => void;
  onTestTemplate?: (template: NotificationTemplate) => void;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getChannelBadgeVariant = (channel: NotificationChannel) => {
  return channel === 'EMAIL' ? 'default' : 'secondary';
};

// ============================================================================
// COMPONENT
// ============================================================================

export function TemplatesTable({ 
  filters, 
  onFiltersChange,
  onEditTemplate,
  onTestTemplate 
}: TemplatesTableProps) {
  const { t } = useTranslation(['admin', 'common']);
  const { data, isLoading } = useTemplates(filters);
  
  const deleteMutation = useDeleteTemplate();

  const [selectedTemplate, setSelectedTemplate] = React.useState<NotificationTemplate | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

  // ============================================================================
  // MUTATION HANDLERS
  // ============================================================================

  const handleDelete = React.useCallback(() => {
    if (!selectedTemplate) return;
    
    deleteMutation.mutate(selectedTemplate.id, {
      onSuccess: () => {
        toast.success(t('admin:template_deleted_success'));
        setDeleteDialogOpen(false);
        setSelectedTemplate(null);
      },
      onError: (error) => {
        toast.error(t('common:error'), extractErrorMessage(error));
      },
    });
  }, [selectedTemplate, deleteMutation, t]);

  const handleCopyId = React.useCallback((id: string) => {
    navigator.clipboard.writeText(id);
    toast.success(t('common:copied_to_clipboard'));
  }, [t]);

  // ============================================================================
  // TABLE COLUMNS
  // ============================================================================

  const columns: ColumnDef<NotificationTemplate>[] = React.useMemo(() => [
    {
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('admin:template_name')} />,
      cell: ({ row }) => {
        const template = row.original;
        return (
          <div className="flex flex-col">
            <span className="font-medium">{template.name}</span>
            {template.subject && (
              <span className="text-sm text-muted-foreground line-clamp-1">
                {template.subject}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'channel',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('admin:channel')} />,
      cell: ({ row }) => {
        const channel = row.getValue('channel') as NotificationChannel;
        return (
          <Badge variant={getChannelBadgeVariant(channel)}>
            {channel}
          </Badge>
        );
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: 'body',
      header: t('admin:preview'),
      cell: ({ row }) => {
        const body = row.getValue('body') as string;
        return (
          <p className="text-sm text-muted-foreground line-clamp-2 max-w-md">
            {body}
          </p>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: 'updatedAt',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('admin:last_updated')} />,
      cell: ({ row }) => {
        const date = new Date(row.getValue('updatedAt'));
        return (
          <span className="text-sm">
            {formatDistanceToNow(date, { addSuffix: true })}
          </span>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const template = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[180px]">
              <DropdownMenuLabel>{t('admin:actions')}</DropdownMenuLabel>
              
              <DropdownMenuItem onClick={() => onEditTemplate?.(template)}>
                <Edit className="mr-2 h-4 w-4" />
                {t('admin:edit_template')}
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => onTestTemplate?.(template)}>
                <Send className="mr-2 h-4 w-4" />
                {t('admin:test_template')}
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => handleCopyId(template.id)}>
                <Copy className="mr-2 h-4 w-4" />
                {t('admin:copy_template_id')}
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => {
                  setSelectedTemplate(template);
                  setDeleteDialogOpen(true);
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t('admin:delete_template')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], [t, onEditTemplate, onTestTemplate, handleCopyId]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <>
      <DataTable
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        pageCount={data?.totalPages || 0}
        pagination={{
          pageIndex: filters.page - 1,
          pageSize: filters.limit,
        }}
        onPaginationChange={(updater) => {
          const newState = typeof updater === 'function'
            ? updater({ pageIndex: filters.page - 1, pageSize: filters.limit })
            : updater;
          
          onFiltersChange({
            ...filters,
            page: newState.pageIndex + 1,
            limit: newState.pageSize,
          });
        }}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={t('admin:confirm_delete_title')}
        description={t('admin:confirm_delete_template_message', {
          name: selectedTemplate?.name,
        })}
        onConfirm={handleDelete}
        variant="destructive"
        confirmText={t('admin:delete')}
        cancelText={t('common:cancel')}
        isLoading={deleteMutation.isPending}
      />
    </>
  );
}