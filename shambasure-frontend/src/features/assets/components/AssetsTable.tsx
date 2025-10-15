// FILE: src/features/assets/components/AssetsTable.tsx

import type { ColumnDef } from '@tanstack/react-table';
import type { TFunction } from 'i18next';
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

import type { Asset, AssetType } from '../../../types';
import { Button } from '../../../components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../components/ui/DropdownMenu';
import { DataTableColumnHeader } from '../../../components/ui/DataTable';

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// TYPE DEFINITIONS
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

interface AssetsTableActions {
  onEdit: (asset: Asset) => void;
  onDelete: (asset: Asset) => void;
}

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// COLUMNS FACTORY
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

export const getAssetColumns = (
  t: TFunction,
  actions: AssetsTableActions,
): ColumnDef<Asset>[] => {
  // Helper to get icon and label for an asset type, encapsulated within the factory
  const getAssetTypeDetails = (type: AssetType) => {
    const typesMap = {
      LAND_PARCEL: { label: t('assets:type_options.LAND_PARCEL'), icon: '🏞️' },
      RESIDENTIAL_PROPERTY: { label: t('assets:type_options.RESIDENTIAL_PROPERTY'), icon: '🏠' },
      COMMERCIAL_PROPERTY: { label: t('assets:type_options.COMMERCIAL_PROPERTY'), icon: '🏢' },
      VEHICLE: { label: t('assets:type_options.VEHICLE'), icon: '🚗' },
      BANK_ACCOUNT: { label: t('assets:type_options.BANK_ACCOUNT'), icon: '💰' },
      OTHER: { label: t('assets:type_options.OTHER'), icon: '📦' },
    };
    return typesMap[type] || typesMap.OTHER;
  };

  return [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('assets:columns.name')} />
      ),
      cell: ({ row }) => {
        const asset = row.original;
        const details = getAssetTypeDetails(asset.type);
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-muted">
              <span className="text-xl">{details.icon}</span>
            </div>
            <div>
              <span className="font-medium line-clamp-1">{asset.name}</span>
              <span className="text-xs text-muted-foreground">{details.label}</span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'details',
      header: () => <span>{t('assets:columns.details')}</span>,
      cell: ({ row }) => {
        const asset = row.original;
        let detailText = '';
        // Conditionally render details based on the asset type (leveraging discriminated union)
        switch (asset.type) {
          case 'LAND_PARCEL':
            detailText = `${t('assets:parcel_number_short')}: ${asset.details.parcelNumber}`;
            break;
          case 'BANK_ACCOUNT':
            detailText = `${asset.details.bankName} - ...${asset.details.accountNumber.slice(-4)}`;
            break;
          case 'VEHICLE':
            detailText = `${asset.details.make} ${asset.details.model} (${asset.details.licensePlate})`;
            break;
          case 'RESIDENTIAL_PROPERTY':
          case 'COMMERCIAL_PROPERTY':
            detailText = asset.details.address;
            break;
          default:
            return <span className="text-sm text-muted-foreground">—</span>;
        }
        return <p className="text-sm text-muted-foreground line-clamp-1">{detailText}</p>;
      },
    },
    {
      accessorKey: 'updatedAt',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('assets:columns.last_updated')} />
      ),
      cell: ({ row }) => {
        const date = new Date(row.getValue('updatedAt'));
        return <span className="text-sm">{formatDistanceToNow(date, { addSuffix: true })}</span>;
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const asset = row.original;
        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">{t('common:open_menu')}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => actions.onEdit(asset)}>
                  <Edit className="mr-2 h-4 w-4" />
                  <span>{t('common:edit')}</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => actions.onDelete(asset)}
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
