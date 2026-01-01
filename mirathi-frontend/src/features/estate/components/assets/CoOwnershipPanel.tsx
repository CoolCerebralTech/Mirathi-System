// components/assets/CoOwnershipPanel.tsx

import React from 'react';
import { Users, PieChart, Loader2, ExternalLink } from 'lucide-react';
import { Progress, Badge } from '@/components/ui';
import { Avatar, AvatarFallback } from '@/components/common';
import { useAssetDetails } from '@/features/estate/estate.api';
import type { AssetItemResponse } from '@/types/estate.types';

// Define the CoOwner shape based on what we expect from the API
interface CoOwner {
  id: string;
  name: string;
  sharePercentage: number;
  type: string; // JOINT_TENANCY etc.
  evidenceUrl?: string;
}

// Interface extending the basic response to include coOwners list
interface AssetWithCoOwners extends AssetItemResponse {
  coOwners?: CoOwner[];
}

interface CoOwnershipPanelProps {
  assetId: string;
  estateId: string;
}

export const CoOwnershipPanel: React.FC<CoOwnershipPanelProps> = ({ assetId, estateId }) => {
  const { data: assetData, isLoading } = useAssetDetails(estateId, assetId);
  
  // Cast to our extended type to safely access coOwners
  const asset = assetData as unknown as AssetWithCoOwners;

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!asset) return null;

  const estateShare = asset.estateSharePercentage || 100;
  const isWholelyOwned = estateShare === 100;
  const coOwners = asset.coOwners || [];

  return (
    <div className="space-y-4">
      {/* Summary Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1.5">
          <PieChart className="h-3.5 w-3.5" /> Ownership Structure
        </h4>
        <Badge variant={isWholelyOwned ? "outline" : "secondary"} className="text-[10px]">
          {isWholelyOwned ? 'Sole Ownership' : 'Co-Owned'}
        </Badge>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-slate-700 font-medium">Estate Share</span>
          <span className="font-bold">{estateShare.toFixed(2)}%</span>
        </div>
        <Progress value={estateShare} className="h-2 bg-slate-100" />
        <p className="text-xs text-muted-foreground text-right">
          Remaining {100 - estateShare}% held by others
        </p>
      </div>

      {/* Co-Owners List */}
      {!isWholelyOwned && coOwners.length > 0 && (
        <div className="pt-2">
          <h5 className="text-xs font-medium text-slate-900 mb-2">Registered Co-Owners</h5>
          <div className="space-y-2">
            {coOwners.map((owner) => (
              <div key={owner.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-md border border-slate-100">
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-[10px] bg-white border">
                      {owner.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium leading-none">{owner.name}</span>
                    <span className="text-[10px] text-muted-foreground mt-0.5 lowercase">
                      {owner.type.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold">{owner.sharePercentage}%</span>
                  {owner.evidenceUrl && (
                    <a 
                      href={owner.evidenceUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-primary transition-colors"
                      title="View Evidence"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Informational Alert */}
      {!isWholelyOwned && (
        <div className="rounded bg-amber-50 p-2.5 text-xs text-amber-800 border border-amber-100 flex gap-2 items-start mt-2">
          <Users className="h-4 w-4 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Only the estate's share ({estateShare}%) is subject to valuation and distribution under S.29 LSA.
          </p>
        </div>
      )}

      {isWholelyOwned && (
        <p className="text-xs text-muted-foreground text-center pt-2">
          Wholely owned by the deceased. 100% distributable.
        </p>
      )}
    </div>
  );
};