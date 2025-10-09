// FILE: src/features/admin/components/TemplatesTable.tsx

// FILE: src/features/admin/components/TemplatesTable.tsx
import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Pencil, Trash2, Send } from 'lucide-react';

import { useTemplates, useDeleteTemplate, useTestTemplate } from '../templates.api';
import type { NotificationTemplate } from '../../../types';

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

interface TemplatesTableProps {
  filters: {
    page: number;
    limit: number;
    channel?: string;
  };
  onFiltersChange: (filters: any) => void;
  onEdit: (template: NotificationTemplate) => void;
}

export function TemplatesTable({ filters, onFiltersChange, onEdit }: TemplatesTableProps) {
  const { t } = useTranslation(['common']);
  const { data, isLoading } = useTemplates(filters);
  const deleteMutation = useDeleteTemplate();
  const testMutation = useTestTemplate();

  const [selectedTemplate, setSelectedTemplate] = React.useState<NotificationTemplate | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

  const handleDelete = () => {
    if (!selectedTemplate) return;
    
    deleteMutation.mutate(selectedTemplate.id, {
      onSuccess: () => {
        toast.success('Template deleted successfully');
        setDeleteDialogOpen(false);
        setSelectedTemplate(null);
      },
      onError: (error) => {
        toast.error('Failed to delete template', extractErrorMessage(error));
      },
    });
  };

  const handleTest = (templateId: string) => {
    const email = prompt('Enter test email address:');
    if (!email) return;

    testMutation.mutate(
      { templateId, recipientEmail: email },
      {
        onSuccess: () => {
          toast.success('Test email sent successfully');
        },
        onError: (error) => {
          toast.error('Failed to send test email', extractErrorMessage(error));
        },
      }
    );
  };

  const columns: ColumnDef<NotificationTemplate>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
      cell: ({ row }) => <div className="font-medium">{row.getValue('name')}</div>,
    },
    {
      accessorKey: 'channel',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Channel" />,
      cell: ({ row }) => {
        const channel = row.getValue('channel') as string;
        return (
          <Badge variant={channel === 'EMAIL' ? 'default' : 'secondary'}>
            {channel}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'subject',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Subject" />,
      cell: ({ row }) => {
        const subject = row.getValue('subject') as string | null;
        return subject ? (
          <span className="text-sm">{subject}</span>
        ) : (
          <span className="text-sm text-muted-foreground">N/A</span>
        );
      },
    },
    {
      accessorKey: 'updatedAt',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Updated" />,
      cell: ({ row }) => formatDate(row.getValue('updatedAt')),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const template = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              
              <DropdownMenuItem onClick={() => onEdit(template)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit Template
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => handleTest(template.id)}>
                <Send className="mr-2 h-4 w-4" />
                Send Test
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
                Delete Template
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        pageCount={data?.totalPages}
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

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Template"
        description={`Are you sure you want to delete "${selectedTemplate?.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        variant="destructive"
        isLoading={deleteMutation.isPending}
      />
    </>
  );
}