// components/assets/AssetCard.tsx

import React from 'react';
import { MoreHorizontal, ShieldAlert, Lock } from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  Button,
  Badge
} from '@/components/ui';
import { MoneyDisplay } from '../shared/MoneyDisplay';
import { AssetTypeFields } from './AssetTypeFields';
import { CoOwnershipPanel } from './CoOwnershipPanel';
import { AssetStatus, type AssetItemResponse } from '@/types/estate.types';
import { cn } from '@/lib/utils';

interface AssetCardProps {
  asset: AssetItemResponse;
  onViewDetails: (id: string) => void;
  onEdit: (id: string) => void;
}

export const AssetCard: React.FC<AssetCardProps> = ({ asset, onViewDetails, onEdit }) => {
  const isEncumbered = asset.isEncumbered;

  return (
    <Card className={cn(
      "transition-all hover:shadow-md",
      asset.status === AssetStatus.SOLD && "opacity-75 bg-slate-50"
    )}>
      <CardHeader className="flex flex-row items-start justify-between pb-2 space-y-0">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] font-bold tracking-wide">
              {asset.type}
            </Badge>
            {isEncumbered && (
              <Badge variant="destructive" className="text-[10px] px-1.5 gap-1">
                <Lock className="h-3 w-3" /> Encumbered
              </Badge>
            )}
          </div>
          <h3 className="font-semibold text-lg leading-none truncate max-w-[200px]" title={asset.name}>
            {asset.name}
          </h3>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 -mt-1 -mr-2">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onViewDetails(asset.id)}>
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(asset.id)}>
              Update Valuation
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Value Display */}
        <div className="py-2">
          <p className="text-xs text-muted-foreground uppercase">Current Valuation</p>
          <div className="text-2xl font-bold text-slate-900">
            <MoneyDisplay amount={asset.currentValue} />
          </div>
        </div>

        {/* Polymorphic Details */}
        <AssetTypeFields asset={asset} />

        {/* Encumbrance Warning */}
        {isEncumbered && (
          <div className="flex items-start gap-2 bg-red-50 p-2 rounded text-xs text-red-700 border border-red-100">
            <ShieldAlert className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>
              {asset.encumbranceDetails || 'Asset is linked to a debt or claim.'}
            </span>
          </div>
        )}

        {/* Ownership */}
        <CoOwnershipPanel asset={asset} />
      </CardContent>
    </Card>
  );
};