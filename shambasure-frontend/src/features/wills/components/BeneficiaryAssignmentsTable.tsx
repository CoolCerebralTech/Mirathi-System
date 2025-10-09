// FILE: src/features/wills/components/BeneficiaryAssignmentsTable.tsx

import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';
import { DataTable } from '../../../components/ui/DataTable';
import { type BeneficiaryAssignment } from '../../../types';
import { Button } from '../../../components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '../../../components/common/UserMenu';

type ActionsProps = {
  assignment: BeneficiaryAssignment;
  onDelete: (assignmentId: string) => void;
};

const ActionsCell = ({ assignment, onDelete }: ActionsProps) => {
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
        <DropdownMenuItem
          onClick={() => onDelete(assignment.id)}
          className="text-destructive focus:bg-destructive/80 focus:text-white"
        >
          Remove Assignment
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const getBeneficiaryColumns = (onDelete: (assignmentId: string) => void): ColumnDef<BeneficiaryAssignment>[] => [
  {
    accessorKey: 'asset',
    header: 'Asset',
    cell: ({ row }) => (
        <div className="font-medium">{row.original.asset.name}</div>
    ),
  },
  {
    accessorKey: 'beneficiary',
    header: 'Beneficiary',
    cell: ({ row }) => (
        <div>{row.original.beneficiary.firstName} {row.original.beneficiary.lastName}</div>
    ),
  },
  {
    accessorKey: 'sharePercent',
    header: 'Share (%)',
    cell: ({ row }) => {
      const share = row.getValue('sharePercent');
      return share ? `${share}%` : <span className="text-muted-foreground">Not specified</span>;
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => <ActionsCell assignment={row.original} onDelete={onDelete} />,
  },
];

interface BeneficiaryAssignmentsTableProps {
    assignments: BeneficiaryAssignment[];
    onDelete: (assignmentId: string) => void;
}

export function BeneficiaryAssignmentsTable({ assignments, onDelete }: BeneficiaryAssignmentsTableProps) {
    const columns = React.useMemo(() => getBeneficiaryColumns(onDelete), [onDelete]);
    
    return <DataTable columns={columns} data={assignments} />;
}