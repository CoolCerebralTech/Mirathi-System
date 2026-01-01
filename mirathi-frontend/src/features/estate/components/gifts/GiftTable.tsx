// components/gifts/GiftTable.tsx

import { useState } from 'react';
import { MoreHorizontal, AlertTriangle, CheckCircle, TrendingUp, Search } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';

import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DataTable,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input, // Added Input
} from '@/components/ui';

import { MoneyDisplay } from '../shared/MoneyDisplay';
import type { GiftItemResponse, GiftStatus, AssetType } from '@/types/estate.types';

interface GiftTableProps {
  data: GiftItemResponse[];
  totalHotchpotAddBack?: { amount: number; currency: string; formatted: string };
  isLoading?: boolean;
  onContest: (id: string) => void;
  onResolve: (id: string) => void;
  onViewDetails?: (id: string) => void;
}

export function GiftTable({
  data,
  totalHotchpotAddBack,
  isLoading = false,
  onContest,
  onResolve,
  onViewDetails,
}: GiftTableProps) {
  // Local state for search
  const [searchTerm, setSearchTerm] = useState('');

  // Filter data based on search term
  const filteredData = data.filter((item) =>
    item.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns: ColumnDef<GiftItemResponse>[] = [
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => {
        const gift = row.original;
        return (
          <div className="flex flex-col">
            <span className="font-medium">{gift.description}</span>
            <span className="text-xs text-muted-foreground">
              Given on {new Date(gift.dateGiven).toLocaleDateString()}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'recipientId',
      header: 'Recipient',
      cell: ({ row }) => {
        // In a real app, you'd fetch the recipient name from Family Service
        return (
          <span className="text-sm">
            {row.original.recipientId.slice(0, 8)}...
          </span>
        );
      },
    },
    {
      accessorKey: 'assetType',
      header: 'Type',
      cell: ({ row }) => (
        <Badge variant="outline">
          {formatAssetType(row.original.assetType)}
        </Badge>
      ),
    },
    {
      accessorKey: 'valueAtTimeOfGift',
      header: 'Original Value',
      cell: ({ row }) => (
        /* --- FIX 1: Changed 'money' to 'amount' --- */
        <MoneyDisplay amount={row.original.valueAtTimeOfGift} />
      ),
    },
    {
      accessorKey: 'hotchpotValue',
      header: 'Hotchpot Value',
      cell: ({ row }) => {
        const gift = row.original;
        const hasAppreciation = gift.hotchpotValue.amount > gift.valueAtTimeOfGift.amount;
        
        return (
          <HoverCard>
            <HoverCardTrigger asChild>
              <div className="flex items-center gap-2 cursor-help">
                {/* --- FIX 2: Changed 'money' to 'amount' --- */}
                <MoneyDisplay 
                  amount={gift.hotchpotValue} 
                  className="font-semibold text-primary"
                />
                {hasAppreciation && (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                )}
              </div>
            </HoverCardTrigger>
            <HoverCardContent className="w-80">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">S.35(3) Hotchpot Calculation</h4>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Original Value:</span>
                    <span>{gift.valueAtTimeOfGift.formatted}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Current Value:</span>
                    <span>{gift.hotchpotValue.formatted}</span>
                  </div>
                  {hasAppreciation && (
                    <div className="flex justify-between text-green-600 font-medium">
                      <span>Appreciation:</span>
                      <span>
                        +{((gift.hotchpotValue.amount - gift.valueAtTimeOfGift.amount) / gift.valueAtTimeOfGift.amount * 100).toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  This value will be added back to the distributable pool
                </p>
              </div>
            </HoverCardContent>
          </HoverCard>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const gift = row.original;
        return (
          <div className="flex items-center gap-2">
            <Badge variant={getStatusVariant(gift.status)}>
              {gift.status}
            </Badge>
            {gift.isContested && (
              <Badge variant="destructive" className="text-xs">
                Disputed
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'isSubjectToHotchpot',
      header: 'Hotchpot',
      cell: ({ row }) => {
        const isSubject = row.original.isSubjectToHotchpot;
        return isSubject ? (
          <Badge variant="default" className="text-xs">
            Yes
          </Badge>
        ) : (
          <Badge variant="secondary" className="text-xs">
            No
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const gift = row.original;
        
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
              <DropdownMenuSeparator />
              
              {onViewDetails && (
                <DropdownMenuItem onClick={() => onViewDetails(gift.id)}>
                  View Details
                </DropdownMenuItem>
              )}
              
              {/* Status-Specific Actions */}
              {gift.status === 'RECORDED' && !gift.isContested && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => onContest(gift.id)}
                    className="text-destructive"
                  >
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Contest Gift
                  </DropdownMenuItem>
                </>
              )}
              
              {gift.isContested && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onResolve(gift.id)}>
                    <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                    Resolve Dispute
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      {/* Summary Card - Only show if totalHotchpotAddBack is provided */}
      {totalHotchpotAddBack && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">S.35 Hotchpot Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Value Added Back to Pool</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {data.filter(g => g.isSubjectToHotchpot).length} of {data.length} gifts subject to hotchpot
                </p>
              </div>
              <div className="text-right">
                {/* --- FIX 3: Changed 'money' to 'amount' --- */}
                <MoneyDisplay 
                  amount={totalHotchpotAddBack} 
                  className="text-2xl font-bold text-primary"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Bar */}
      <div className="flex items-center">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search gifts..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Loading State or Data Table */}
      {isLoading ? (
        <div className="w-full h-32 flex items-center justify-center border rounded-md bg-muted/10">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
             <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
             <span className="text-sm">Loading gifts...</span>
          </div>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredData}
          // Removed searchKey, searchPlaceholder, and isLoading props
        />
      )}
      
      {/* Empty State */}
      {data.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No gifts recorded</p>
          <p className="text-sm text-muted-foreground mt-1">
            S.35(3) LSA: Gifts inter vivos must be brought into hotchpot for fair distribution
          </p>
        </div>
      )}
    </div>
  );
}

// Helper Functions
function getStatusVariant(status: GiftStatus): 'default' | 'warning' | 'success' | 'destructive' | 'secondary' {
  const statusMap: Record<GiftStatus, 'default' | 'warning' | 'success' | 'destructive' | 'secondary'> = {
    RECORDED: 'default',
    CONTESTED: 'warning',
    VERIFIED: 'success',
    EXCLUDED: 'secondary',
  };
  return statusMap[status] || 'secondary';
}

function formatAssetType(assetType: AssetType): string {
  const assetTypeMap: Record<AssetType, string> = {
    LAND: 'Land',
    VEHICLE: 'Vehicle',
    FINANCIAL: 'Financial',
    BUSINESS: 'Business',
    PERSONAL: 'Personal',
    DIGITAL: 'Digital',
    INSURANCE: 'Insurance',
  };
  return assetTypeMap[assetType] || assetType;
}