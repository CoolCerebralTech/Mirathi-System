import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import { DebtWaterfall } from '../../features/estate/components/DebtWaterfall';
import { Button } from '../../components/ui/Button';

export function LiabilityManagementPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  if (!id) return null;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Liability Management</h1>
          <p className="text-muted-foreground">
            Manage estate debts according to Section 45 priorities.
          </p>
        </div>
      </div>

      <DebtWaterfall estateId={id} />
    </div>
  );
}