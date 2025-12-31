import React from 'react';
import { Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button, Avatar, AvatarFallback } from '../../../../components/ui';
import { MoneyDisplay } from '../shared/MoneyDisplay';

// Logic: Mocking the owners list until we hook up `useAssetDetails`
interface CoOwner {
    id: string;
    name: string;
    sharePercentage: number;
    type: string; // JOINT_TENANCY etc
}

interface CoOwnershipPanelProps {
    assetValue: number;
    currency: string;
    owners?: CoOwner[];
    estateSharePercentage: number;
    onAddOwner?: () => void;
}

export const CoOwnershipPanel: React.FC<CoOwnershipPanelProps> = ({ 
    assetValue, 
    currency, 
    owners = [], 
    estateSharePercentage,
    onAddOwner 
}) => {
    const estateValue = assetValue * (estateSharePercentage / 100);

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                    <span className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-600" /> Ownership Structure
                    </span>
                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onAddOwner}>
                        Add Co-Owner
                    </Button>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                
                {/* Visual Bar */}
                <div className="space-y-2">
                    <div className="flex h-6 w-full overflow-hidden rounded-md border">
                        <div 
                            className="bg-primary flex items-center justify-center text-[10px] text-white font-bold" 
                            style={{ width: `${estateSharePercentage}%` }}
                        >
                            Estate ({estateSharePercentage}%)
                        </div>
                        <div 
                            className="bg-slate-200 flex items-center justify-center text-[10px] text-slate-600 font-bold" 
                            style={{ width: `${100 - estateSharePercentage}%` }}
                        >
                            Others ({100 - estateSharePercentage}%)
                        </div>
                    </div>
                    <div className="flex justify-between text-xs font-medium">
                        <div>
                            <span className="text-muted-foreground block">Estate Value</span>
                            <MoneyDisplay amount={{ amount: estateValue, currency }} colored className="text-primary" />
                        </div>
                        <div className="text-right">
                            <span className="text-muted-foreground block">Total Asset Value</span>
                            <MoneyDisplay amount={{ amount: assetValue, currency }} />
                        </div>
                    </div>
                </div>

                {/* Owners List */}
                <div className="space-y-3">
                    <h4 className="text-sm font-semibold">Registered Owners</h4>
                    {owners.length === 0 ? (
                        <div className="flex items-center gap-3 p-3 rounded-lg border bg-slate-50/50">
                            <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-primary/10 text-primary text-xs">E</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <p className="text-sm font-medium">The Estate (Deceased)</p>
                                <p className="text-xs text-muted-foreground">Sole Owner (Pending Verification)</p>
                            </div>
                            <div className="text-right font-bold text-sm">{estateSharePercentage}%</div>
                        </div>
                    ) : (
                        owners.map(owner => (
                            <div key={owner.id} className="flex items-center gap-3 p-3 rounded-lg border bg-white">
                                <Avatar className="h-8 w-8">
                                    <AvatarFallback className="bg-slate-100 text-slate-600 text-xs">
                                        {owner.name.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <p className="text-sm font-medium">{owner.name}</p>
                                    <p className="text-xs text-muted-foreground capitalize">
                                        {owner.type.replace(/_/g, ' ').toLowerCase()}
                                    </p>
                                </div>
                                <div className="text-right font-bold text-sm">{owner.sharePercentage}%</div>
                            </div>
                        ))
                    )}
                </div>

            </CardContent>
        </Card>
    );
};