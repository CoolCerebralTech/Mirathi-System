import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../../components/ui';
import { LiquidationForm } from '../forms/LiquidationForm';

export const InitiateLiquidationDialog: React.FC<{ open: boolean; onOpenChange: (v: boolean) => void; estateId: string; assetId: string }> = ({ open, onOpenChange, estateId, assetId }) => (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
            <DialogHeader><DialogTitle>Sell Asset to Pay Debts</DialogTitle></DialogHeader>
            <LiquidationForm estateId={estateId} assetId={assetId} onSuccess={() => onOpenChange(false)} />
        </DialogContent>
    </Dialog>
);