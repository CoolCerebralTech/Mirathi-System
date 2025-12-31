import React from 'react';
import { WitnessCard } from './WitnessCard';
import type { WitnessSummary } from '@/types/will.types';
import { EmptyState } from '@/components/common';
import { Users, UserPlus, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui';
import { Alert, AlertDescription } from '@/components/ui';

interface WitnessListProps {
  witnesses: WitnessSummary[];
  onAdd?: () => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  loading?: boolean;
}

export const WitnessList: React.FC<WitnessListProps> = ({
  witnesses,
  onAdd,
  onEdit,
  onDelete,
  loading
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-[160px] rounded-xl bg-slate-100 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!witnesses || witnesses.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No Witnesses Nominated"
        description="For a Will to be valid under Kenyan Law, it must be signed by you in the presence of at least 2 competent witnesses."
        action={onAdd ? {
            label: "Nominate Witness",
            onClick: onAdd
        } : undefined}
      />
    );
  }

  const isValidCount = witnesses.length >= 2;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">
          Witnesses ({witnesses.length})
        </h3>
        {onAdd && (
          <Button onClick={onAdd} size="sm" className="gap-2">
            <UserPlus className="h-4 w-4" />
            Add Witness
          </Button>
        )}
      </div>

      {!isValidCount && (
        <Alert className="bg-amber-50 text-amber-900 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription>
            You need <strong>{2 - witnesses.length} more</strong> witness(es) to meet the minimum legal requirement.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {witnesses.map((witness) => (
          <WitnessCard 
            key={witness.id} 
            data={witness} 
            onEdit={onEdit} 
            onDelete={onDelete} 
          />
        ))}
      </div>
    </div>
  );
};