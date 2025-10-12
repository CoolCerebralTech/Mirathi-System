// FILE: src/features/wills/components/BeneficiaryAssignmentTable.tsx

import * as React from 'react';
import type { ColumnDef } from '@tantml:react-table';
import { Trash2, Percent } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { BeneficiaryAssignment } from '../../../types';
import { Button } from '../../../components/ui/Button';
import { Avatar } from '../../../components/common/Avatar';
import { Badge } from '../../../components/ui/Badge';
import { DataTableColumnHeader } from '../../../components/ui/DataTable';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface BeneficiaryAssignmentTableProps {
  onDelete: (assignmentId: string) => void;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getInitials = (firstName: string, lastName: string): string => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

const getAssetTypeInfo = (type: string) => {
  const types: Record<string, { icon: string; color: string }> = {
    LAND_PARCEL: { icon: '🏞️', color: 'bg-emerald-100 text-emerald-700' },
    PROPERTY: { icon: '🏠', color: 'bg-blue-100 text-blue-700' },
    VEHICLE: { icon: '🚗', color: 'bg-purple-100 text-purple-700' },
    BANK_ACCOUNT: { icon: '💰', color: 'bg-amber-100 text-amber-700' },
    OTHER: { icon: '📦', color: 'bg-slate-100 text-slate-700' },
  };
  return types[type] || types.OTHER;
};

// ============================================================================
// COLUMNS FACTORY
// ============================================================================

export const getBeneficiaryAssignmentColumns = (
  handlers: BeneficiaryAssignmentTableProps
): ColumnDef<BeneficiaryAssignment>[] => {
  return [
    {
      accessorKey: 'asset',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Asset" />,
      cell: ({ row }) => {
        const asset = row.original.asset;
        if (!asset) return <span className="text-muted-foreground">—</span>;
        
        const typeInfo = getAssetTypeInfo(asset.type);
        
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <span>{typeInfo.icon}</span>
            </div>
            <div className="flex flex-col">
              <span className="font-medium">{asset.name}</span>
              <Badge variant="outline" className={`text-xs ${typeInfo.color}`}>
                {asset.type.replace('_', ' ')}
              </Badge>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'beneficiary',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Beneficiary" />,
      cell: ({ row }) => {
        const beneficiary = row.original.beneficiary;
        if (!beneficiary) return <span className="text-muted-foreground">—</span>;
        
        return (
          <div className="flex items-center gap-3">
            <Avatar
              src={undefined}
              alt={`${beneficiary.firstName} ${beneficiary.lastName}`}
              fallback={getInitials(beneficiary.firstName, beneficiary.lastName)}
              className="h-8 w-8"
            />
            <div className="flex flex-col">
              <span className="font-medium">
                {beneficiary.firstName} {beneficiary.lastName}
              </span>
              <span className="text-sm text-muted-foreground">{beneficiary.email}</span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'sharePercent',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Share" />,
      cell: ({ row }) => {
        const share = row.getValue('sharePercent') as number | null;
        
        if (!share) {
          return <span className="text-muted-foreground">Not specified</span>;
        }
        
        return (
          <div className="flex items-center gap-2">
            <Percent className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{share}%</span>
          </div>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const assignment = row.original;

        return (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={() => handlers.onDelete(assignment.id)}
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Delete</span>
          </Button>
        );
      },
    },
  ];
};