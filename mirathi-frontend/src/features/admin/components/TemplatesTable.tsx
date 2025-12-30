// FILE: src/features/admin/components/TemplatesTable.tsx

import type { ColumnDef } from '@tanstack/react-table';
import type { TFunction } from 'i18next';
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';

import type { Template } from '../../../types';
import { Button } from '../../../components/ui/Button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../../components/ui/DropdownMenu';
import { DataTableColumnHeader } from '../../../components/ui/DataTable';
import { Badge } from '../../../components/ui/Badge';

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// TYPE DEFINITIONS
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

interface TemplatesTableActions {
  onEdit: (template: Template) => void;
  onDelete: (template: Template) => void;
}

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// COLUMNS FACTORY
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

export const getTemplatesTableColumns = (t: TFunction, actions: TemplatesTableActions): ColumnDef<Template>[] => {
  return [
    {
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('admin:templates.columns.name')} />,
      cell: ({ row }) => {
        const template = row.original;
        return (
          <div>
            <p className="font-medium">{template.name}</p>
            {template.description && <p className="text-sm text-muted-foreground">{template.description}</p>}
          </div>
        );
      },
    },
    {
      accessorKey: 'templateType',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('admin:templates.columns.type')} />,
      cell: ({ row }) => <span className="text-sm font-mono bg-muted px-2 py-1 rounded">{row.original.templateType}</span>,
    },
    {
        accessorKey: 'channel',
        header: ({ column }) => <DataTableColumnHeader column={column} title={t('admin:templates.columns.channel')} />,
        cell: ({ row }) => <Badge variant="outline">{row.original.channel}</Badge>,
    },
    {
      accessorKey: 'isActive',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('admin:templates.columns.status')} />,
      cell: ({ row }) => {
        const isActive = row.original.isActive;
        return <Badge variant={isActive ? 'success' : 'secondary'}>{isActive ? 'Active' : 'Inactive'}</Badge>;
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const template = row.original;
        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => actions.onEdit(template)}>
                  <Edit className="mr-2 h-4 w-4" />
                  <span>{t('common:edit')}</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => actions.onDelete(template)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>{t('common:delete')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
};
