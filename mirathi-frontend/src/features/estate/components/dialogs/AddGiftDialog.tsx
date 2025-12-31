import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../../components/ui';
import { GiftForm } from '../forms/GiftForm';

export const AddGiftDialog: React.FC<{ open: boolean; onOpenChange: (v: boolean) => void; estateId: string }> = ({ open, onOpenChange, estateId }) => (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
            <DialogHeader><DialogTitle>Record Gift Inter Vivos</DialogTitle></DialogHeader>
            <GiftForm estateId={estateId} onSuccess={() => onOpenChange(false)} />
        </DialogContent>
    </Dialog>
);