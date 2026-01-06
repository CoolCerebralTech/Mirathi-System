import React, { useState } from 'react';
import { Plus, CreditCard, CheckCircle2, AlertCircle } from 'lucide-react';
import { 
  Button, 
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Alert,
  AlertDescription,
  Badge
} from '@/components/ui';
import { useDebtList } from '../../estate.api';
import { EmptyState } from '@/components/common/EmptyState';
import { DebtPriorityBadge } from './DebtPriorityBadge';
import { AddDebtDialog } from './AddDebtDialog';
import { PayDebtDialog } from './PayDebtDialog';
import type { DebtResponse } from '@/types/estate.types';

interface DebtListProps {
  estateId: string;
}

export const DebtList: React.FC<DebtListProps> = ({ estateId }) => {
  const { data: debts, isLoading, isError, error } = useDebtList(estateId);
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [payingDebtId, setPayingDebtId] = useState<string | null>(null);

  // Calculate summary statistics
  const totalDebt = debts?.reduce((sum, debt) => sum + debt.outstandingBalance, 0) || 0;
  const paidDebts = debts?.filter(d => d.status === 'PAID_IN_FULL').length || 0;
  const criticalDebts = debts?.filter(d => d.priority === 'CRITICAL').length || 0;

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };


  const getStatusBadge = (debt: DebtResponse) => {
    switch (debt.status) {
      case 'PAID_IN_FULL':
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Paid
          </Badge>
        );
      case 'PARTIALLY_PAID':
        return (
          <Badge variant="outline" className="border-blue-500 text-blue-700">
            Partially Paid
          </Badge>
        );
      case 'DISPUTED':
        return (
          <Badge variant="destructive">
            <AlertCircle className="w-3 h-3 mr-1" /> Disputed
          </Badge>
        );
      case 'WRITTEN_OFF':
        return (
          <Badge variant="outline" className="text-gray-500">
            Written Off
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="border-orange-400 text-orange-700">
            Outstanding
          </Badge>
        );
    }
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>

        {/* Table Skeleton */}
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  // Error State
  if (isError) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load liabilities: {error?.message || 'Unknown error occurred'}
          </AlertDescription>
        </Alert>
        <Button onClick={() => window.location.reload()} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Liabilities & Debts</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Automatically ordered by legal priority (Section 45, Law of Succession Act)
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} size="lg">
          <Plus className="mr-2 h-4 w-4" /> Record Debt
        </Button>
      </div>

      {/* Summary Statistics */}
      {debts && debts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg border border-red-200">
            <p className="text-sm text-red-700 font-medium">Total Outstanding Debt</p>
            <p className="text-2xl font-bold text-red-900 mt-1">
              {formatCurrency(totalDebt)}
            </p>
            <p className="text-xs text-red-600 mt-1">{debts.length} liability(ies)</p>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
            <p className="text-sm text-orange-700 font-medium">Critical Priority Debts</p>
            <p className="text-2xl font-bold text-orange-900 mt-1">
              {criticalDebts}
            </p>
            <p className="text-xs text-orange-600 mt-1">
              {criticalDebts > 0 ? 'Requires immediate attention' : 'None'}
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
            <p className="text-sm text-green-700 font-medium">Paid Debts</p>
            <p className="text-2xl font-bold text-green-900 mt-1">
              {paidDebts} / {debts.length}
            </p>
            <p className="text-xs text-green-600 mt-1">
              {Math.round((paidDebts / debts.length) * 100)}% settled
            </p>
          </div>
        </div>
      )}

      {/* Debt Table or Empty State */}
      {!debts || debts.length === 0 ? (
        <EmptyState 
          title="No Liabilities Recorded" 
          description="This estate currently has no recorded debts or financial obligations. If there are any outstanding liabilities, record them here to ensure proper legal succession planning." 
          actionLabel="Record First Debt"
          onAction={() => setIsAddDialogOpen(true)}
        />
      ) : (
        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">Priority</TableHead>
                <TableHead>Creditor</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Original</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
                <TableHead className="text-right w-[120px]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {debts.map((debt) => (
                <TableRow key={debt.id} className="hover:bg-muted/50">
                  <TableCell>
                    <DebtPriorityBadge priority={debt.priority} />
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{debt.creditorName}</span>
                      {debt.isSecured && (
                        <span className="text-xs text-muted-foreground mt-0.5">
                          🔒 Secured Debt
                        </span>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell className="text-muted-foreground text-sm">
                    {debt.category.replace(/_/g, ' ')}
                  </TableCell>
                  
                  <TableCell>
                    {getStatusBadge(debt)}
                  </TableCell>
                  
                  <TableCell className="text-right font-mono text-sm">
                    {formatCurrency(debt.originalAmount)}
                  </TableCell>
                  
                  <TableCell className="text-right font-mono font-semibold">
                    {debt.status === 'PAID_IN_FULL' ? (
                      <span className="text-green-600 flex items-center justify-end gap-1">
                        <CheckCircle2 className="w-4 h-4" /> KES 0
                      </span>
                    ) : (
                      <span className="text-red-600">
                        {formatCurrency(debt.outstandingBalance)}
                      </span>
                    )}
                  </TableCell>
                  
                  <TableCell className="text-right">
                    {debt.status !== 'PAID_IN_FULL' && debt.status !== 'WRITTEN_OFF' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setPayingDebtId(debt.id)}
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

      {/* Legal Notice */}
      {debts && debts.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <strong>Legal Notice:</strong> Debts are automatically prioritized according to 
            Section 45 of the Law of Succession Act (Cap 160). Funeral expenses and taxes 
            must be paid first, followed by secured debts.
          </AlertDescription>
        </Alert>
      )}

      {/* Add Debt Dialog */}
      <AddDebtDialog 
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        estateId={estateId}
      />

      {/* Pay Debt Dialog */}
      {payingDebtId && (
        <PayDebtDialog
          isOpen={true}
          onClose={() => setPayingDebtId(null)}
          debtId={payingDebtId}
          debt={debts?.find(d => d.id === payingDebtId)}
        />
      )}
    </div>
  );
};