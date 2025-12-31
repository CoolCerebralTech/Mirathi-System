import React from 'react';
import { BeneficiaryCard } from './BeneficiaryCard';
import type { BequestSummary } from '@/types/will.types';
import { EmptyState } from '@/components/common'; 
import { PlusCircle, Users } from 'lucide-react';
import { Button } from '@/components/ui';

interface BeneficiaryListProps {
  bequests: BequestSummary[];
  onAdd?: () => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  loading?: boolean;
}

export const BeneficiaryList: React.FC<BeneficiaryListProps> = ({
  bequests,
  onAdd,
  onEdit,
  onDelete,
  loading
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-[200px] rounded-xl bg-slate-100 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!bequests || bequests.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No Beneficiaries Added"
        description="Start by adding the people or organizations you want to inherit your estate."
        // FIX: Passing the strict object shape required by the EmptyState component interface
        action={onAdd ? {
          label: "Add First Beneficiary",
          onClick: onAdd
        } : undefined}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">
          Beneficiaries ({bequests.length})
        </h3>
        {onAdd && (
          <Button onClick={onAdd} size="sm" className="gap-2">
            <PlusCircle className="h-4 w-4" />
            Add Beneficiary
          </Button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {bequests.map((bequest) => (
          <BeneficiaryCard 
            key={bequest.id} 
            data={bequest} 
            onEdit={onEdit} 
            onDelete={onDelete} 
          />
        ))}
      </div>
    </div>
  );
};