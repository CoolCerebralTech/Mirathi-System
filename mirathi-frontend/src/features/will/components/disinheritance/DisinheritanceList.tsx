import React from 'react';
import { DisinheritanceCard } from './DisinheritanceCard';
import type { DisinheritanceSummary } from '@/types/will.types';
import { EmptyState } from '@/components/common';
import { ShieldBan, UserMinus } from 'lucide-react';
import { Button } from '@/components/ui';

interface DisinheritanceListProps {
  records: DisinheritanceSummary[];
  onAdd?: () => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  loading?: boolean;
}

export const DisinheritanceList: React.FC<DisinheritanceListProps> = ({
  records,
  onAdd,
  onEdit,
  onDelete,
  loading
}) => {
  if (loading) {
    return <div className="space-y-4 animate-pulse">
        <div className="h-24 bg-slate-100 rounded-lg" />
        <div className="h-24 bg-slate-100 rounded-lg" />
    </div>;
  }

  if (!records || records.length === 0) {
    return (
      <EmptyState
        icon={ShieldBan}
        title="No Disinheritance Records"
        description="Every dependent is currently accounted for. If you wish to exclude someone, you must record it here to satisfy S.26 of the LSA."
        action={onAdd ? {
            label: "Record Exclusion",
            onClick: onAdd
        } : undefined}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
         <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <UserMinus className="h-5 w-5 text-slate-600" />
            Exclusions ({records.length})
         </h3>
         {onAdd && (
            <Button onClick={onAdd} variant="outline" size="sm" className="text-red-700 hover:text-red-800 hover:bg-red-50 border-red-200">
               Record New Exclusion
            </Button>
         )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {records.map((record) => (
          <DisinheritanceCard 
            key={record.id} 
            data={record} 
            onEdit={onEdit} 
            onDelete={onDelete} 
          />
        ))}
      </div>
    </div>
  );
};