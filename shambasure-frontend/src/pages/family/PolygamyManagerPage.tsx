import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import { Button } from '../../components/ui/Button';
import { PolygamyHouseManager } from '../../features/family/components/PolygamyHouseManager';

export function PolygamyManagerPage() {
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
          <h1 className="text-2xl font-bold tracking-tight">Section 40 House Management</h1>
          <p className="text-muted-foreground">
            Manage polygamous houses to ensure fair asset distribution under Kenyan Law.
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* The Component we built earlier */}
        <PolygamyHouseManager familyId={id} />
      </div>
    </div>
  );
}