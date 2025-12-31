import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../../components/ui';
import { DependantClaimForm } from '../forms/DependantClaimForm';

export const AddDependantDialog: React.FC<{ open: boolean; onOpenChange: (v: boolean) => void; estateId: string }> = ({ open, onOpenChange, estateId }) => (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
            <DialogHeader><DialogTitle>File S.29 Dependency Claim</DialogTitle></DialogHeader>
            <DependantClaimForm estateId={estateId} onSuccess={() => onOpenChange(false)} />
        </DialogContent>
    </Dialog>
);