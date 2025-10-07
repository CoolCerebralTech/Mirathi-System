// FILE: src/features/documents/components/DocumentsTable.tsx

import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Download } from 'lucide-react';

import { type Document } from '../../../types';
import { DataTableColumnHeader } from '../../../components/ui/DataTable';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '../../../components/common/UserMenu';

// Props to connect actions from the page to the table rows
type ActionsProps = {
  document: Document;
  onDownload: (documentId: string) => void;
  onDelete: (documentId: string) => void;
};

const ActionsCell = ({ document, onDownload, onDelete }: ActionsProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => onDownload(document.id)}>
          <Download className="mr-2 h-4 w-4" />
          Download
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onDelete(document.id)}
          className="text-destructive focus:bg-destructive/80 focus:text-white"
          disabled={document.status === 'VERIFIED'} // Cannot delete verified documents
        >
          Delete Document
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const getDocumentColumns = (
    onDownload: (documentId: string) => void,
    onDelete: (documentId: string) => void,
): ColumnDef<Document>[] => [
  {
    accessorKey: 'filename',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Filename" />,
    cell: ({ row }) => <span className="font-medium">{row.getValue('filename')}</span>,
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      const variant =
        status === 'VERIFIED' ? 'default' :
        status === 'REJECTED' ? 'destructive' :
        'secondary';
      return <Badge variant={variant}>{status.replace(/_/g, ' ')}</Badge>;
    },
  },
  {
      accessorKey: 'sizeBytes',
      header: 'File Size',
      cell: ({ row }) => {
          const sizeBytes = row.getValue('sizeBytes') as number;
          // Simple utility to format bytes into KB/MB
          const formatBytes = (bytes: number, decimals = 2) => {
              if (bytes === 0) return '0 Bytes';
              const k = 1024;
              const dm = decimals < 0 ? 0 : decimals;
              const sizes = ['Bytes', 'KB', 'MB', 'GB'];
              const i = Math.floor(Math.log(bytes) / Math.log(k));
              return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
          }
          return <span>{formatBytes(sizeBytes)}</span>;
      },
  },
  {
    accessorKey: 'updatedAt',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Last Updated" />,
    cell: ({ row }) => new Date(row.getValue('updatedAt')).toLocaleDateString(),
  },
  {
    id: 'actions',
    cell: ({ row }) => <ActionsCell document={row.original} onDownload={onDownload} onDelete={onDelete} />,
  },
];