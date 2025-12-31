import React from 'react';
import { Building2, Car, Briefcase, Coins, MoreVertical } from 'lucide-react';
import { Card, Button, Badge, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../../../../components/ui';
import { MoneyDisplay } from '../shared/MoneyDisplay';
import { AssetType, AssetStatus, type AssetItemResponse } from '../../../../types/estate.types';
import { cn } from '../../../../lib/utils';

interface AssetCardProps {
    asset: AssetItemResponse;
    onClick?: () => void;
    onEdit?: () => void;
}

export const AssetCard: React.FC<AssetCardProps> = ({ asset, onClick, onEdit }) => {
    
    // Helper to get Icon based on type
    const getIcon = (type: string) => {
        switch(type) {
            case AssetType.LAND: return <Building2 className="h-8 w-8 text-emerald-600" />;
            case AssetType.VEHICLE: return <Car className="h-8 w-8 text-blue-600" />;
            case AssetType.BUSINESS: return <Briefcase className="h-8 w-8 text-purple-600" />;
            case AssetType.FINANCIAL: return <Coins className="h-8 w-8 text-amber-600" />;
            default: return <Building2 className="h-8 w-8 text-slate-600" />;
        }
    };

    // Helper for Status Color
    const getStatusColor = (status: string) => {
        switch(status) {
            case AssetStatus.ACTIVE: return "bg-green-100 text-green-700 hover:bg-green-100";
            case AssetStatus.SOLD: return "bg-slate-100 text-slate-700 hover:bg-slate-100";
            case AssetStatus.DISPUTED: return "bg-red-100 text-red-700 hover:bg-red-100";
            case AssetStatus.PENDING_VERIFICATION: return "bg-amber-100 text-amber-700 hover:bg-amber-100";
            default: return "bg-slate-100 text-slate-700";
        }
    };

    return (
        <Card className="group relative overflow-hidden hover:shadow-md transition-all cursor-pointer" onClick={onClick}>
            <div className="absolute top-3 right-3 z-10">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 bg-white/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={e => { e.stopPropagation(); onEdit?.(); }}>Edit Details</DropdownMenuItem>
                        <DropdownMenuItem onClick={e => e.stopPropagation()}>View Valuation History</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                    <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                        {getIcon(asset.type)}
                    </div>
                    <Badge className={cn("pointer-events-none", getStatusColor(asset.status))}>
                        {asset.status.replace(/_/g, ' ')}
                    </Badge>
                </div>

                <div className="space-y-1">
                    <h3 className="font-semibold text-lg line-clamp-1" title={asset.name}>
                        {asset.name}
                    </h3>
                    <p className="text-sm text-muted-foreground capitalize">
                        {asset.type.toLowerCase()} {asset.description ? `• ${asset.description}` : ''}
                    </p>
                </div>

                <div className="mt-4 pt-4 border-t flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Current Value</span>
                        <MoneyDisplay amount={asset.currentValue} className="text-lg font-bold" />
                    </div>
                    
                    {asset.isEncumbered && (
                        <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 text-[10px]">
                            Encumbered
                        </Badge>
                    )}
                </div>
            </div>
        </Card>
    );
};