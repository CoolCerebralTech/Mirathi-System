import React from 'react';
import { Gavel, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from '../../../../components/ui';
import { MoneyDisplay } from '../shared/MoneyDisplay';

// Mocking Liquidation Data extension since it sits on top of Asset
interface LiquidationData {
    id: string;
    assetName: string;
    method: 'PUBLIC_AUCTION' | 'PRIVATE_TREATY';
    status: 'PENDING_APPROVAL' | 'APPROVED' | 'SOLD' | 'PROCEEDS_RECEIVED';
    targetAmount: number;
    actualAmount?: number;
    currency: string;
    initiatedDate: string;
}

interface LiquidationCardProps {
    data: LiquidationData;
    onRecordSale: (id: string) => void;
}

export const LiquidationCard: React.FC<LiquidationCardProps> = ({ data, onRecordSale }) => {
    const getStatusColor = (status: string) => {
        switch(status) {
            case 'SOLD': return "bg-green-100 text-green-700";
            case 'APPROVED': return "bg-blue-100 text-blue-700";
            case 'PENDING_APPROVAL': return "bg-amber-100 text-amber-700";
            default: return "bg-slate-100 text-slate-700";
        }
    };

    return (
        <Card className="border-l-4 border-l-amber-500">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-base font-semibold">{data.assetName}</CardTitle>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <Gavel className="h-3 w-3" />
                            {data.method.replace('_', ' ')}
                        </div>
                    </div>
                    <Badge className={getStatusColor(data.status)} variant="secondary">
                        {data.status.replace('_', ' ')}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-4 my-4">
                    <div className="space-y-1">
                        <span className="text-xs text-muted-foreground">Target Price</span>
                        <MoneyDisplay amount={{ amount: data.targetAmount, currency: data.currency }} className="font-semibold block" />
                    </div>
                    <div className="space-y-1">
                        <span className="text-xs text-muted-foreground">Realized Price</span>
                        {data.actualAmount ? (
                            <MoneyDisplay amount={{ amount: data.actualAmount, currency: data.currency }} className="font-bold text-green-600 block" />
                        ) : (
                            <span className="text-sm text-slate-400 italic">Not sold yet</span>
                        )}
                    </div>
                </div>

                {data.status === 'APPROVED' && (
                    <Button size="sm" className="w-full" onClick={() => onRecordSale(data.id)}>
                        <TrendingUp className="mr-2 h-4 w-4" /> Record Sale
                    </Button>
                )}
            </CardContent>
        </Card>
    );
};