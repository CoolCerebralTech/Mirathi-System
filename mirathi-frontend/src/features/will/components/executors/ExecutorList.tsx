import React from 'react';
import { ExecutorCard } from './ExecutorCard';
import type { ExecutorSummary } from '@/types/will.types';
import { EmptyState } from '@/components/common';
import { UserCog, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui';

interface ExecutorListProps {
  executors: ExecutorSummary[];
  onAdd?: () => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  loading?: boolean;
}

export const ExecutorList: React.FC<ExecutorListProps> = ({
  executors,
  onAdd,
  onEdit,
  onDelete,
  loading
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-[180px] rounded-xl bg-slate-100 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!executors || executors.length === 0) {
    return (
      <EmptyState
        icon={UserCog}
        title="No Executors Appointed"
        description="You must appoint at least one person to administer your estate (maximum 4)."
        action={onAdd ? {
            label: "Appoint Executor",
            onClick: onAdd
        } : undefined}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">
          Executors ({executors.length}/4)
        </h3>
        {onAdd && executors.length < 4 && (
          <Button onClick={onAdd} size="sm" className="gap-2">
            <UserPlus className="h-4 w-4" />
            Appoint Executor
          </Button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {executors.map((executor) => (
          <ExecutorCard 
            key={executor.id} 
            data={executor} 
            onEdit={onEdit} 
            onDelete={onDelete} 
          />
        ))}
      </div>
    </div>
  );
};