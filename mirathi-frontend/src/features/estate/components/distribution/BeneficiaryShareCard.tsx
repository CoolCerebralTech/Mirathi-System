import React from 'react';
import { User, Gift, ArrowRight } from 'lucide-react';
import { Card, CardContent, Separator } from '../../../../components/ui';
import { MoneyDisplay } from '../shared/MoneyDisplay';
import { type BeneficiaryShare } from '../../../../types/estate.types';

interface BeneficiaryShareCardProps {
    share: BeneficiaryShare;
}

export const BeneficiaryShareCard: React.FC<BeneficiaryShareCardProps> = ({ share }) => {
    return (
        <Card className="overflow-hidden">
            <div className="bg-slate-50 p-4 border-b">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white border shadow-sm">
                        <User className="h-5 w-5 text-slate-600" />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-900">{share.beneficiaryName}</h4>
                        <p className="text-xs text-muted-foreground">{share.relationship} • {share.grossSharePercentage}% Share</p>
                    </div>
                </div>
            </div>
            
            <CardContent className="p-4 space-y-3">
                <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Gross Entitlement</span>
                    <MoneyDisplay amount={share.grossShareValue} className="font-medium" />
                </div>

                {share.lessGiftInterVivos.amount > 0 && (
                    <div className="flex justify-between text-sm text-amber-700 bg-amber-50 p-2 rounded">
                        <span className="flex items-center gap-1">
                            <Gift className="h-3 w-3" /> Less: Previous Gifts (S.35)
                        </span>
                        <MoneyDisplay amount={share.lessGiftInterVivos} />
                    </div>
                )}

                <Separator />

                <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900">Net Distributable</span>
                    <div className="flex items-center gap-2">
                        <ArrowRight className="h-4 w-4 text-green-500" />
                        <MoneyDisplay amount={share.netDistributableValue} className="font-bold text-lg text-green-700" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};