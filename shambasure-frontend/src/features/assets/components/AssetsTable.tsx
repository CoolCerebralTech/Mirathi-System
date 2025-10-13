// FILE: src/features/assets/components/AssetsTable.tsx (New & Finalized)

import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';

import { Asset, AssetType } from '../../../types/schemas/assets.schemas';
import { Button } from '../../../components/ui/Button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../../components/ui/DropdownMenu';
import { DataTableColumnHeader } from '../../../components/ui/DataTable';

interface AssetsTableHandlers {
  onEdit: (asset: Asset) => void;
  onDelete: (asset: Asset) => void;
}

// Helper to get icon and label for an asset type
const getAssetTypeDetails = (type: AssetType, t: Function) => {
  const types = {
    LAND_PARCEL: { label: t('assets:type_land_parcel'), icon: '🏞️' },
    PROPERTY: { label: t('assets:type_property'), icon: '🏠' },
    VEHICLE: { label: t('assets:type_vehicle'), icon: '🚗' },
    BANK_ACCOUNT: { label: t('assets:type_bank_account'), icon: '💰' },
    OTHER: { label: t('assets:type_other'), icon: '📦' },
  };
  return types[type] || types['OTHER'];
};

export const getAssetColumns = (handlers: AssetsTableHandlers): ColumnDef<Asset>[] => {
  const { t } = useTranslation(['assets']);

  return [
    {
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('assets:asset_name')} />,
      cell: ({ row }) => {
        const asset = row.original;
        const details = getAssetTypeDetails(asset.type, t);
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <span className="text-xl">{details.icon}</span>
            </div>
            <div className="flex flex-col">
              <span className="font-medium line-clamp-1">{asset.name}</span>
              <span className="text-xs text-muted-foreground">{details.label}</span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'description',
      header: () => <span>{t('assets:description')}</span>,
      cell: ({ row }) => {
        const description = row.getValue('description') as string;
        return <p className="text-sm text-muted-foreground line-clamp-2">{description || '—'}</p>;
      },
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('assets:date_added')} />,
      cell: ({ row }) => {
        const date = new Date(row.getValue('createdAt'));
        return <span className="text-sm">{formatDistanceToNow(date, { addSuffix: true })}</span>;
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
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handlers.onEdit(asset)}>
                <Edit className="mr-2 h-4 w-4" />
                <span>{t('common:edit')}</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => handlers.onDelete(asset)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                <span>{t('common:delete')}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
};