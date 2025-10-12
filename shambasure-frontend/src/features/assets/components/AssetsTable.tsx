// FILE: src/features/assets/components/AssetsTable.tsx

import * as React from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Edit, Trash2, Eye, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';

import type { Asset, AssetType } from '../../../types';
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
import { DataTableColumnHeader } from '../../../components/ui/DataTable';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface AssetsTableProps {
  onEdit: (asset: Asset) => void;
  onDelete: (assetId: string) => void;
  onViewDetails?: (asset: Asset) => void;
  onAssignBeneficiaries?: (asset: Asset) => void;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getAssetTypeInfo = (type: AssetType) => {
  const types = {
    LAND_PARCEL: { label: 'Land Parcel', icon: '🏞️', color: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
    PROPERTY: { label: 'Property', icon: '🏠', color: 'bg-blue-100 text-blue-700 border-blue-300' },
    VEHICLE: { label: 'Vehicle', icon: '🚗', color: 'bg-purple-100 text-purple-700 border-purple-300' },
    BANK_ACCOUNT: { label: 'Bank Account', icon: '💰', color: 'bg-amber-100 text-amber-700 border-amber-300' },
    OTHER: { label: 'Other', icon: '📦', color: 'bg-slate-100 text-slate-700 border-slate-300' },
  };
  return types[type] || types.OTHER;
};

// ============================================================================
// COLUMNS FACTORY
// ============================================================================

export const getAssetColumns = (handlers: AssetsTableProps): ColumnDef<Asset>[] => {
  return [
    {
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Asset" />,
      cell: ({ row }) => {
        const asset = row.original;
        const typeInfo = getAssetTypeInfo(asset.type);
        
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <span className="text-xl">{typeInfo.icon}</span>
            </div>
            <div className="flex flex-col">
              <span className="font-medium">{asset.name}</span>
              {asset.description && (
                <span className="text-sm text-muted-foreground line-clamp-1">
                  {asset.description}
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'type',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
      cell: ({ row }) => {
        const type = row.getValue('type') as AssetType;
        const typeInfo = getAssetTypeInfo(type);
        
        return (
          <Badge variant="outline" className={typeInfo.color}>
            <span className="mr-1">{typeInfo.icon}</span>
            {typeInfo.label}
          </Badge>
        );
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
      cell: ({ row }) => {
        const date = new Date(row.getValue('createdAt'));
        return (
          <div className="flex flex-col">
            <span className="text-sm">
              {formatDistanceToNow(date, { addSuffix: true })}
            </span>
            <span className="text-xs text-muted-foreground">
              {date.toLocaleDateString()}
            </span>
          </div>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const asset = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              
              {handlers.onViewDetails && (
                <DropdownMenuItem onClick={() => handlers.onViewDetails!(asset)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
              )}

              <DropdownMenuItem onClick={() => handlers.onEdit(asset)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Asset
              </DropdownMenuItem>

              {handlers.onAssignBeneficiaries && (
                <DropdownMenuItem onClick={() => handlers.onAssignBeneficiaries!(asset)}>
                  <Users className="mr-2 h-4 w-4" />
                  Assign Beneficiaries
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => handlers.onDelete(asset.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Asset
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
};