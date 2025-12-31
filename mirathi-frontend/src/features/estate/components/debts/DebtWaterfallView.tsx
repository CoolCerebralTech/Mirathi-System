import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle, Button } from '../../../../components/ui';
import { LoadingSpinner, EmptyState } from '../../../../components/common';
import { useDebtWaterfall } from '../../estate.api';
import { DebtTierCard } from './DebtTierCard';
import { type DebtItemResponse } from '../../../../types/estate.types';

interface DebtWaterfallViewProps {
    estateId: string;
    onPayDebt: (debtId: string, item: DebtItemResponse) => void;
    onDispute: (debtId: string) => void;
}

export const DebtWaterfallView: React.FC<DebtWaterfallViewProps> = ({ 
    estateId, onPayDebt, onDispute 
}) => {
    const { data, isLoading } = useDebtWaterfall(estateId);

    if (isLoading) return <LoadingSpinner text="Analyzing S.45 Priorities..." />;
    if (!data) return <EmptyState title="No Liabilities" description="No debts recorded yet." />;

    // Waterfall Logic: Check if previous tier is cleared to unlock the next
    const isTier1Cleared = data.tier1_FuneralExpenses.every(d => d.status === 'PAID');
    const isTier2Cleared = data.tier2_Testamentary.every(d => d.status === 'PAID');
    const isTier3Cleared = data.tier3_SecuredDebts.every(d => d.status === 'PAID');
    // Note: Tier 4 and 5 often run concurrently in practice depending on liquidity, 
    // but strictly S.45 prefers taxes first. The UI enforces "Suggested" order via locking visual.
    
    // Strict Mode: Unlock only if previous is done
    const isTier2Locked = !isTier1Cleared; 
    const isTier3Locked = !isTier2Cleared; 
    const isTier4Locked = !isTier3Cleared;
    const isTier5Locked = !isTier4Cleared; // Assuming Tier 4 logic exists, usually Taxes

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            
            {/* Header / Instructions */}
            <Alert className="bg-blue-50 border-blue-200">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-800 font-semibold">Section 45 Compliance Active</AlertTitle>
                <AlertDescription className="text-blue-700 text-xs mt-1">
                    Kenyan law requires debts to be paid in this specific order. 
                    Personal debts (Tier 5) cannot be paid until all previous tiers are settled.
                </AlertDescription>
            </Alert>

            {/* Tier 1: Funeral */}
            <DebtTierCard 
                tierNumber={1}
                title="Funeral Expenses"
                description="Reasonable expenses for the burial."
                items={data.tier1_FuneralExpenses}
                isLocked={false}
                onPayDebt={onPayDebt}
                onDispute={onDispute}
            />

            {/* Tier 2: Testamentary */}
            <DebtTierCard 
                tierNumber={2}
                title="Testamentary & Legal"
                description="Expenses for obtaining Grant of Probate."
                items={data.tier2_Testamentary}
                isLocked={isTier2Locked}
                onPayDebt={onPayDebt}
                onDispute={onDispute}
            />

            {/* Tier 3: Secured */}
            <DebtTierCard 
                tierNumber={3}
                title="Secured Debts"
                description="Mortgages and loans backed by assets."
                items={data.tier3_SecuredDebts}
                isLocked={isTier3Locked}
                onPayDebt={onPayDebt}
                onDispute={onDispute}
            />

             {/* Tier 4: Taxes */}
             <DebtTierCard 
                tierNumber={4}
                title="Taxes & Statutory Wages"
                description="KRA arrears and domestic staff wages."
                items={data.tier4_TaxesAndWages}
                isLocked={isTier4Locked}
                onPayDebt={onPayDebt}
                onDispute={onDispute}
            />

             {/* Tier 5: Unsecured */}
             <DebtTierCard 
                tierNumber={5}
                title="Unsecured Creditors"
                description="Personal loans, credit cards, other claims."
                items={data.tier5_Unsecured}
                isLocked={isTier5Locked}
                onPayDebt={onPayDebt}
                onDispute={onDispute}
            />

            {!data.canPayNextTier && (
                <div className="flex justify-center pt-4">
                    <Button variant="outline" className="text-amber-600 border-amber-200 hover:bg-amber-50">
                        <AlertTriangle className="mr-2 h-4 w-4" />
                        Insolvency Warning: Liquidation required
                    </Button>
                </div>
            )}
        </div>
    );
};