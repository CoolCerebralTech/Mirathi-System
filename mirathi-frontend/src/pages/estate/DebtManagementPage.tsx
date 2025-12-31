import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, History } from 'lucide-react';

import { Button, Card, CardContent } from '../../components/ui';
import { PageHeader } from '../../components/common';

// Features
import { DebtWaterfallView } from '../../features/estate/components/debts/DebtWaterfallView';
import { PaymentHistory } from '../../features/estate/components/debts/PaymentHistory';
import { AddDebtDialog } from '../../features/estate/dialogs/AddDebtDialog';
import { PayDebtDialog } from '../../features/estate/dialogs/PayDebtDialog';

// API & Types
import { useDisputeDebt } from '../../features/estate/estate.api';
import { type DebtItemResponse } from '../../types/estate.types';

export const DebtManagementPage: React.FC = () => {
  const { id: estateId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [payDebtItem, setPayDebtItem] = useState<DebtItemResponse | null>(null);

  // Dispute Hook
  const { mutate: dispute } = useDisputeDebt(estateId!);

  return (
    <div className="flex flex-col gap-6 p-6 min-h-screen bg-slate-50/50">
      
      {/* 1. Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
            <Button 
                variant="ghost" 
                size="sm" 
                className="mb-2 pl-0 hover:bg-transparent hover:text-primary"
                onClick={() => navigate(`/estates/${estateId}`)}
            >
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
            </Button>
            <PageHeader 
                title="Liabilities & Debts" 
                description="Manage estate debts according to Section 45 Priority (Funeral > Legal > Secured > Unsecured)."
            />
        </div>
        <Button onClick={() => setIsAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Record Liability
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* 2. Main Waterfall View (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
            <DebtWaterfallView 
                estateId={estateId!}
                onPayDebt={(id, item) => setPayDebtItem(item)}
                onDispute={(id) => {
                    if(confirm("Mark this debt as disputed? It will effectively pause payment.")) {
                        dispute({ debtId: id, data: { reason: "User flagged via dashboard" } });
                    }
                }}
            />
        </div>

        {/* 3. Sidebar: History & Stats (1/3 width) */}
        <div className="space-y-6">
            {/* Quick Stats Placeholder */}
            <Card className="bg-slate-900 text-white border-none">
                <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-2 opacity-80">
                        <History className="h-4 w-4" /> Payment Status
                    </div>
                    <div className="text-2xl font-bold">KES 0.00</div>
                    <div className="text-sm opacity-60">Total Paid Out</div>
                </CardContent>
            </Card>

            <PaymentHistory payments={[]} /> {/* Connect to real payment history API */}
        </div>

      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Dialogs */}
      {/* ------------------------------------------------------------------ */}

      <AddDebtDialog 
        open={isAddOpen} 
        onOpenChange={setIsAddOpen} 
        estateId={estateId!} 
      />

      <PayDebtDialog
        open={!!payDebtItem}
        onOpenChange={(open) => !open && setPayDebtItem(null)}
        estateId={estateId!}
        debt={payDebtItem}
      />

    </div>
  );
};