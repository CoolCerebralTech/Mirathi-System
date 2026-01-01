// components/assets/CoOwnershipPanel.tsx

import React from 'react';
import { Users, PieChart } from 'lucide-react';
import { Progress } from '@/components/ui';
import { Button } from '@/components/ui';
import type { AssetItemResponse } from '@/types/estate.types';

interface CoOwnershipPanelProps {
  asset: AssetItemResponse;
  onAddOwner?: () => void;
}

export const CoOwnershipPanel: React.FC<CoOwnershipPanelProps> = ({ asset, onAddOwner }) => {
  const estateShare = asset.estateSharePercentage || 100;
  const isWholelyOwned = estateShare === 100;

  return (
    <div className="space-y-3 pt-4 border-t">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1.5">
          <PieChart className="h-3.5 w-3.5" /> Ownership Structure
        </h4>
        {!isWholelyOwned && onAddOwner && (
          <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={onAddOwner}>
            Manage
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-slate-700">Estate Share</span>
          <span className="font-bold">{estateShare.toFixed(2)}%</span>
        </div>
        <Progress value={estateShare} className="h-2" />
      </div>

      {!isWholelyOwned ? (
        <div className="rounded bg-amber-50 p-2 text-xs text-amber-800 border border-amber-100 flex gap-2">
          <Users className="h-4 w-4 shrink-0" />
          <p>
            This asset is co-owned. Only the estate's share ({estateShare}%) is subject to distribution.
          </p>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Wholely owned by the deceased. 100% distributable.
        </p>
      )}
    </div>
  );
};