import React, { useState } from 'react';
import { Plus, CreditCard, CheckCircle2 } from 'lucide-react';
import { 
  Button, 
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Label
} from '@/components/ui';
import { useDebtList, usePayDebt } from '../../estate.api';
import { EmptyState } from '@/components/common';
import { DebtPriorityBadge } from './DebtPriorityBadge';
import { AddDebtDialog } from './AddDebtDialog';

interface DebtListProps {
  estateId: string;
}

export const DebtList: React.FC<DebtListProps> = ({ estateId }) => {
  const { data: debts, isLoading, isError } = useDebtList(estateId);
  const { mutate: payDebt, isPending: isPaying } = usePayDebt();
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [paymentModal, setPaymentModal] = useState<{ open: boolean; debtId: string | null }>({
    open: false,
    debtId: null
  });
  const [amountToPay, setAmountToPay] = useState<string>('');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(amount);
  };

  const handlePayment = () => {
    if (paymentModal.debtId && amountToPay) {
      payDebt(
        { debtId: paymentModal.debtId, data: { amount: Number(amountToPay) } },
        {
          onSuccess: () => {
            setPaymentModal({ open: false, debtId: null });
            setAmountToPay('');
          }
        }
      );
    }
  };

  if (isLoading) return <div className="space-y-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>;
  if (isError) return <div className="text-red-500">Failed to load liabilities.</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Liabilities & Debts</h2>
          <p className="text-sm text-muted-foreground">Ordered by Legal Priority (S.45 Law of Succession Act)</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Record Debt
        </Button>
      </div>

      {!debts || debts.length === 0 ? (
        <EmptyState 
          title="Debt Free" 
          description="No liabilities have been recorded for this estate." 
          actionLabel="Record Debt"
          onAction={() => setIsAddOpen(true)}
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Priority</TableHead>
                <TableHead>Creditor</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {debts.map((debt) => (
                <TableRow key={debt.id}>
                  <TableCell>
                    <DebtPriorityBadge priority={debt.priority} />
                  </TableCell>
                  <TableCell className="font-medium">
                    {debt.creditorName}
                    {debt.isSecured && <span className="ml-2 text-xs text-muted-foreground">(Secured)</span>}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {debt.category.replace('_', ' ')}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {debt.status === 'PAID_IN_FULL' ? (
                      <span className="text-green-600 flex items-center justify-end gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Paid
                      </span>
                    ) : (
                      formatCurrency(debt.outstandingBalance)
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {debt.status !== 'PAID_IN_FULL' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setPaymentModal({ open: true, debtId: debt.id })}
                      >
                        <CreditCard className="w-3 h-3 mr-2" /> Pay
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add Dialog */}
      {isAddOpen && (
        <AddDebtDialog 
          isOpen={isAddOpen} 
          onClose={() => setIsAddOpen(false)} 
          estateId={estateId} 
        />
      )}

      {/* Quick Payment Modal */}
      <Dialog open={paymentModal.open} onOpenChange={(open) => setPaymentModal({ ...paymentModal, open })}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Amount to Pay (KES)</Label>
              <Input 
                type="number" 
                value={amountToPay} 
                onChange={(e) => setAmountToPay(e.target.value)}
                placeholder="0.00" 
              />
            </div>
            <Button className="w-full" onClick={handlePayment} disabled={!amountToPay || isPaying}>
              {isPaying ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Payment'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};