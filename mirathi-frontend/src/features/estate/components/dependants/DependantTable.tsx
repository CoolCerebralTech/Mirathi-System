// components/dependants/DependantTable.tsx

import { useState } from 'react'; // Import useState
import { MoreHorizontal, FileText, CheckCircle, XCircle, DollarSign, Search } from 'lucide-react';
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
  Input, // Ensure Input is imported (or import it from its specific file if not in ui index)
} from '@/components/ui';

import { MoneyDisplay } from '../shared/MoneyDisplay';
import type { DependantItemResponse, DependantStatus, DependantRelationship } from '@/types/estate.types';

interface DependantTableProps {
  data: DependantItemResponse[];
  isLoading?: boolean;
  onVerify: (id: string) => void;
  onReject: (id: string) => void;
  onSettle: (id: string) => void;
  onAddEvidence: (id: string) => void;
}

export function DependantTable({
  data,
  isLoading = false,
  onVerify,
  onReject,
  onSettle,
  onAddEvidence,
}: DependantTableProps) {
  // State for local filtering
  const [searchTerm, setSearchTerm] = useState('');

  // Filter data based on search term
  const filteredData = data.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns: ColumnDef<DependantItemResponse>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => {
        const dependant = row.original;
        return (
          <div className="flex flex-col">
            <span className="font-medium">{dependant.name}</span>
            {dependant.isMinor && (
              <span className="text-xs text-muted-foreground">
                {dependant.age ? `Age: ${dependant.age}` : 'Minor'}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'relationship',
      header: 'Relationship',
      cell: ({ row }) => (
        <Badge variant="outline">
          {formatRelationship(row.original.relationship)}
        </Badge>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge variant={getStatusVariant(status)}>
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'riskLevel',
      header: 'Risk',
      cell: ({ row }) => {
        const riskLevel = row.original.riskLevel;
        
        return (
          <HoverCard>
            <HoverCardTrigger asChild>
              <Badge 
                variant={riskLevel === 'HIGH' ? 'destructive' : riskLevel === 'MEDIUM' ? 'warning' : 'secondary'}
              >
                {riskLevel}
              </Badge>
            </HoverCardTrigger>
            <HoverCardContent className="w-80">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Risk Assessment</h4>
                <div className="text-sm space-y-1">
                  {row.original.isMinor && (
                    <p>• <span className="font-medium">Minor</span> - Requires guardian representation</p>
                  )}
                  {row.original.isIncapacitated && (
                    <p>• <span className="font-medium">Incapacitated</span> - Requires special care provisions</p>
                  )}
                  {!row.original.hasSufficientEvidence && (
                    <p>• <span className="font-medium">Insufficient Evidence</span> - Additional documentation needed</p>
                  )}
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
        );
      },
    },
    {
      accessorKey: 'monthlyMaintenanceNeeds',
      header: 'Monthly Needs',
      cell: ({ row }) => (
        <MoneyDisplay amount={row.original.monthlyMaintenanceNeeds} />
      ),
    },
    {
      accessorKey: 'proposedAllocation',
      header: 'Proposed Allocation',
      cell: ({ row }) => {
        const allocation = row.original.proposedAllocation;
        if (!allocation) {
          return <span className="text-muted-foreground text-sm">Not set</span>;
        }
        return (
          <MoneyDisplay 
            amount={allocation} 
            className="font-semibold text-primary" 
          />
        );
      },
    },
    {
      accessorKey: 'evidenceCount',
      header: 'Evidence',
      cell: ({ row }) => {
        const dependant = row.original;
        return (
          <div className="flex items-center gap-2">
            <span className="text-sm">{dependant.evidenceCount} docs</span>
            {!dependant.hasSufficientEvidence && (
              <Badge variant="warning" className="text-xs">
                Insufficient
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const dependant = row.original;
        
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
              
              {/* Evidence Management */}
              <DropdownMenuItem onClick={() => onAddEvidence(dependant.id)}>
                <FileText className="mr-2 h-4 w-4" />
                Add Evidence
              </DropdownMenuItem>
              
              {/* Status-Specific Actions */}
              {dependant.status === 'PENDING' && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => onVerify(dependant.id)}
                    disabled={!dependant.hasSufficientEvidence}
                  >
                    <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                    Verify Claim
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onReject(dependant.id)}
                    className="text-destructive"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject Claim
                  </DropdownMenuItem>
                </>
              )}
              
              {dependant.status === 'VERIFIED' && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onSettle(dependant.id)}>
                    <DollarSign className="mr-2 h-4 w-4 text-primary" />
                    Settle Claim
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
      {/* Search Input */}
      <div className="flex items-center">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search dependants..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Loading State or Table */}
      {isLoading ? (
        <div className="w-full h-32 flex items-center justify-center border rounded-md bg-muted/10">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
             <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
             <span className="text-sm">Loading dependants...</span>
          </div>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredData}
          // Removed searchKey, searchPlaceholder, and isLoading props
        />
      )}
      
      {data.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No dependant claims filed yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            S.29 LSA allows dependants to file claims for reasonable provision
          </p>
        </div>
      )}
    </div>
  );
}

// Helper Functions
function getStatusVariant(status: DependantStatus): 'default' | 'warning' | 'success' | 'destructive' | 'secondary' {
  const statusMap: Record<DependantStatus, 'default' | 'warning' | 'success' | 'destructive' | 'secondary'> = {
    PENDING: 'warning',
    VERIFIED: 'success',
    REJECTED: 'destructive',
    SETTLED: 'default',
  };
  return statusMap[status] || 'secondary';
}

function formatRelationship(relationship: DependantRelationship): string {
  const relationshipMap: Record<DependantRelationship, string> = {
    CHILD: 'Child',
    SPOUSE: 'Spouse',
    PARENT: 'Parent',
    GRANDCHILD: 'Grandchild',
    OTHER: 'Other',
  };
  return relationshipMap[relationship] || relationship;
}