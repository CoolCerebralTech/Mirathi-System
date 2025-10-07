// FILE: src/features/assets/components/AssetsTable.tsx

import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';

import { type Asset } from '../../../types';
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

// This is the function that will be called when the user clicks "Delete"
// We pass it in as a prop from the page to keep the component clean.
type ActionsProps = {
  asset: Asset;
  onEdit: (asset: Asset) => void;
  onDelete: (assetId: string) => void;
};

const ActionsCell = ({ asset, onEdit, onDelete }: ActionsProps) => {
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
        <DropdownMenuItem onClick={() => onEdit(asset)}>
          Edit Asset
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onDelete(asset.id)}
          className="text-destructive focus:bg-destructive/80 focus:text-white"
        >
          Delete Asset
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};


// We define the getColumns function to make it easy to pass props to the cells
export const getAssetColumns = (
    onEdit: (asset: Asset) => void,
    onDelete: (assetId: string) => void
): ColumnDef<Asset>[] => [
  {
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Asset Name" />,
    cell: ({ row }) => <span className="font-medium">{row.getValue('name')}</span>,
  },
  {
    accessorKey: 'type',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
    cell: ({ row }) => <Badge variant="secondary">{row.getValue('type').replace(/_/g, ' ')}</Badge>,
  },
  {
    accessorKey: 'description',
    header: 'Description',
    cell: ({ row }) => {
        const description = row.getValue('description') as string | undefined;
        // Truncate long descriptions for table view
        return <span className="text-muted-foreground">{description?.substring(0, 50) || '-'}{description && description.length > 50 ? '...' : ''}</span>
    }
  },
  {
    accessorKey: 'updatedAt',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Last Updated" />,
    cell: ({ row }) => new Date(row.getValue('updatedAt')).toLocaleDateString(),
  },
  {
    id: 'actions',
    cell: ({ row }) => <ActionsCell asset={row.original} onEdit={onEdit} onDelete={onDelete} />,
  },
];