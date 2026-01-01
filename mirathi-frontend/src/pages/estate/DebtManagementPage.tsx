// pages/estate/DebtManagementPage.tsx

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, DollarSign, Info } from 'lucide-react';
import { Button } from '@/components/ui';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui';
import { Alert, AlertDescription } from '@/components/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui';
import {
  useDebtWaterfall,
  useEstateDashboard,
  useExecuteWaterfall,
} from '@/features/estate/estate.api';
import {
  DebtWaterfallView,
  DebtTierCard,
  MoneyDisplay,
} from '@/features/estate/components';
import { AddDebtDialog } from '@/features/estate/dialogs';

export const DebtManagementPage: React.FC = () => {
  const { estateId } = useParams<{ estateId: string }>();
  const navigate = useNavigate();
  const [showExecuteDialog, setShowExecuteDialog] = useState(false);

  const { data: debts, isLoading } = useDebtWaterfall(estateId!);
  const { data: dashboard } = useEstateDashboard(estateId!);
  const { mutate: executeWaterfall, isPending: isExecuting } = useExecuteWaterfall(estateId!);

  if (!estateId) {
    navigate('/estates');
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-slate-600 mb-4" />
          <p className="text-slate-600">Loading debt information...</p>
        </div>
      </div>
    );
  }

  if (!debts) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 mb-4">Unable to load debts</p>
          <Button onClick={() => navigate(`/estates/${estateId}`)}>
            Back to Estate
          </Button>
        </div>
      </div>
    );
  }

  const handleExecuteWaterfall = () => {
    if (!dashboard?.availableCash) return;

    executeWaterfall(
      {
        availableCash: {
          amount: dashboard.availableCash.amount,
          currency: dashboard.availableCash.currency,
        },
      },
      {
        onSuccess: () => {
          setShowExecuteDialog(false);
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/estates/${estateId}`)}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Estate
          </Button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Debt Management</h1>
              <p className="text-slate-600 mt-1">
                Section 45 Priority Waterfall
              </p>
            </div>

            <div className="flex gap-2">
              <AddDebtDialog
                estateId={estateId}
                trigger={
                  <Button variant="outline">
                    Record New Debt
                  </Button>
                }
              />
              {debts.canPayNextTier && dashboard?.availableCash && (
                <Button
                  onClick={() => setShowExecuteDialog(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <DollarSign className="mr-2 h-4 w-4" />
                  Execute Waterfall
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Liabilities</CardDescription>
              <CardTitle className="text-2xl">
                <MoneyDisplay
                  amount={debts.totalLiabilities.amount}
                  currency={debts.totalLiabilities.currency}
                />
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Paid</CardDescription>
              <CardTitle className="text-2xl text-green-600">
                <MoneyDisplay
                  amount={debts.totalPaid.amount}
                  currency={debts.totalPaid.currency}
                />
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Available Cash</CardDescription>
              <CardTitle className="text-2xl text-blue-600">
                {dashboard && (
                  <MoneyDisplay
                    amount={dashboard.availableCash.amount}
                    currency={dashboard.availableCash.currency}
                  />
                )}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* S.45 Information */}
        <Alert className="mb-6 border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 text-sm">
            <strong>Section 45 Priority Order:</strong> Debts are paid in strict order - 
            Tier 1 (Funeral), Tier 2 (Administration), Tier 3 (Secured), Tier 4 (Taxes), 
            Tier 5 (Unsecured). Lower tiers cannot be paid until higher tiers are fully settled.
          </AlertDescription>
        </Alert>

        {/* Waterfall View */}
        <Tabs defaultValue="waterfall" className="space-y-6">
          <TabsList>
            <TabsTrigger value="waterfall">Waterfall View</TabsTrigger>
            <TabsTrigger value="tier1">
              Tier 1: Funeral ({debts.tier1_FuneralExpenses.length})
            </TabsTrigger>
            <TabsTrigger value="tier2">
              Tier 2: Admin ({debts.tier2_Testamentary.length})
            </TabsTrigger>
            <TabsTrigger value="tier3">
              Tier 3: Secured ({debts.tier3_SecuredDebts.length})
            </TabsTrigger>
            <TabsTrigger value="tier4">
              Tier 4: Taxes ({debts.tier4_TaxesAndWages.length})
            </TabsTrigger>
            <TabsTrigger value="tier5">
              Tier 5: Unsecured ({debts.tier5_Unsecured.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="waterfall">
            <DebtWaterfallView data={debts} estateId={estateId} />
          </TabsContent>

          <TabsContent value="tier1">
            <DebtTierCard
              tierNumber={1}
              title="Funeral Expenses"
              description="Reasonable expenses for the funeral and burial."
              debts={debts.tier1_FuneralExpenses}
              isExpanded={true}
              onToggle={() => {}}
              canPay={debts.canPayNextTier && debts.highestPriorityOutstanding === 1}
              estateId={estateId}
            />
          </TabsContent>

          <TabsContent value="tier2">
            <DebtTierCard
              tierNumber={2}
              title="Testamentary & Administrative"
              description="Legal fees, court costs, and administration expenses."
              debts={debts.tier2_Testamentary}
              isExpanded={true}
              onToggle={() => {}}
              canPay={debts.canPayNextTier && debts.highestPriorityOutstanding === 2}
              estateId={estateId}
            />
          </TabsContent>

          <TabsContent value="tier3">
            <DebtTierCard
              tierNumber={3}
              title="Secured Debts"
              description="Mortgages and loans secured by specific assets."
              debts={debts.tier3_SecuredDebts}
              isExpanded={true}
              onToggle={() => {}}
              canPay={debts.canPayNextTier && debts.highestPriorityOutstanding === 3}
              estateId={estateId}
            />
          </TabsContent>

          <TabsContent value="tier4">
            <DebtTierCard
              tierNumber={4}
              title="Taxes & Wages"
              description="KRA taxes and outstanding wages for domestic staff."
              debts={debts.tier4_TaxesAndWages}
              isExpanded={true}
              onToggle={() => {}}
              canPay={debts.canPayNextTier && debts.highestPriorityOutstanding === 4}
              estateId={estateId}
            />
          </TabsContent>

          <TabsContent value="tier5">
            <DebtTierCard
              tierNumber={5}
              title="Unsecured Debts"
              description="Personal loans, credit cards, and other unsecured debts."
              debts={debts.tier5_Unsecured}
              isExpanded={true}
              onToggle={() => {}}
              canPay={debts.canPayNextTier && debts.highestPriorityOutstanding === 5}
              estateId={estateId}
            />
          </TabsContent>
        </Tabs>

        {/* Execute Waterfall Confirmation */}
        {showExecuteDialog && dashboard && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="max-w-md mx-4">
              <CardHeader>
                <CardTitle>Execute S.45 Waterfall</CardTitle>
                <CardDescription>
                  Automatically distribute available cash to debts in priority order
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    Available cash of{' '}
                    <strong>
                      <MoneyDisplay
                        amount={dashboard.availableCash.amount}
                        currency={dashboard.availableCash.currency}
                      />
                    </strong>{' '}
                    will be distributed starting from the highest priority tier.
                  </AlertDescription>
                </Alert>

                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowExecuteDialog(false)}
                    disabled={isExecuting}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleExecuteWaterfall}
                    disabled={isExecuting}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isExecuting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Execute Waterfall
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};