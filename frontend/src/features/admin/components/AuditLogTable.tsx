// FILE: src/features/admin/components/AuditLogTable.tsx

import { ColumnDef } from '@tanstack/react-table';
import { DataTable, DataTableColumnHeader } from '../../../components/ui/DataTable';
import { useAuditLogs } from '../admin.api'; // Our existing hook
import { type AuditLog, type AuditLogQuery } from '../../../types';
import { Badge } from '../../../components/ui/Badge';

// 1. Define the columns for the AuditLog table.
export const auditLogColumns: ColumnDef<AuditLog>[] = [
  // Column for the Action performed
  {
    accessorKey: 'action',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Action" />,
    cell: ({ row }) => {
      // We can add custom styling based on the action type later if needed
      return <span className="font-medium">{row.getValue('action')}</span>;
    },
  },
  // Column for the User (Actor) who performed the action
  {
    accessorKey: 'actor',
    header: 'Actor',
    cell: ({ row }) => {
      const actor = row.original.actor;
      // The actor might be null (e.g., for a system event) or a user object
      if (!actor) {
        return <span className="text-muted-foreground">System</span>;
      }
      return (
        <div>
          {actor.firstName} {actor.lastName}
          <div className="text-xs text-muted-foreground">{actor.email}</div>
        </div>
      );
    },
  },
  // Column for the timestamp
  {
    accessorKey: 'timestamp',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Timestamp" />,
    cell: ({ row }) => {
      return new Date(row.getValue('timestamp')).toLocaleString();
    },
  },
  // We can add an "Actions" column here to view the raw JSON payload in a modal
  {
    id: 'actions',
    cell: ({ row }) => {
      const log = row.original;
      // This could open a Modal to show the `log.payload` JSON
      return (
        <span className="text-sm text-primary hover:underline cursor-pointer">
          View Details
        </span>
      );
    },
  },
];

// 2. The main AuditLogTable component.
//    NOTE: We are creating this component, but the PAGE will actually render the DataTable directly.
//    This file is primarily for defining and exporting the columns.
//    This is a good pattern for separation of concerns.

// We don't need a full component here, as the page will handle state.
// This file's main job is to export the column definitions.