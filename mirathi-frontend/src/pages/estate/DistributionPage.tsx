// pages/estate/DistributionPage.tsx

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, AlertCircle, Users } from 'lucide-react';
import { Button } from '@/components/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui';
import { Alert, AlertDescription } from '@/components/ui';
import { Badge } from '@/components/ui';
import { Progress } from '@/components/ui';
import {
  useDistributionReadiness,
  useGiftList,
} from '@/features/estate/estate.api';
import {
  ReadinessChecklist,
  BeneficiaryShareCard,
  HotchpotSummary,
  MoneyDisplay,
} from '@/features/estate/components';
import { AddGiftDialog } from '@/features/estate/dialogs';

export const DistributionPage: React.FC = () => {
  const { estateId } = useParams<{ estateId: string }>();
  const navigate = useNavigate();

  const { data: distribution, isLoading } = useDistributionReadiness(estateId!);
  const { data: gifts } = useGiftList(estateId!);

  if (!estateId) {
    navigate('/estates');
    return null;
  }

  if (isLoading || !distribution) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600">Loading distribution data...</p>
        </div>
      </div>
    );
  }

  const isReady = distribution.readinessCheck.isReady;
  const blockers = distribution.readinessCheck.blockers;
  const completedSteps = blockers.length === 0 ? 5 : 5 - blockers.length;
  const totalSteps = 5;
  const readinessPercentage = (completedSteps / totalSteps) * 100;

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
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-slate-900">Distribution</h1>
                {isReady ? (
                  <Badge className="bg-green-600">Ready</Badge>
                ) : (
                  <Badge variant="secondary">Not Ready</Badge>
                )}
              </div>
              <p className="text-slate-600">
                Estate share calculations and distribution readiness
              </p>
            </div>

            <AddGiftDialog
              estateId={estateId}
              trigger={
                <Button variant="outline">
                  Record Gift (S.35)
                </Button>
              }
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Readiness Overview */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Distribution Readiness</CardTitle>
                <CardDescription>
                  {isReady
                    ? 'All prerequisites met. Ready to distribute.'
                    : `${blockers.length} requirement(s) pending`}
                </CardDescription>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">
                  {readinessPercentage.toFixed(0)}%
                </div>
                <div className="text-sm text-slate-600">Complete</div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={readinessPercentage} className="h-2 mb-4" />

            {/* Status Alert */}
            {isReady ? (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  All requirements satisfied. The estate can proceed to distribution.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="border-amber-200 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  <strong>Blockers:</strong> Complete the following before distribution:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    {blockers.map((blocker, idx) => (
                      <li key={idx}>{blocker}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Estate Pool Summary */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Estate Pool</CardTitle>
              <CardDescription>Net distributable value</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-slate-600 mb-1">Net Estate Value</div>
                <div className="text-2xl font-bold">
                  <MoneyDisplay
                    amount={distribution.estateNetValue.amount}
                    currency={distribution.estateNetValue.currency}
                  />
                </div>
              </div>

              {gifts && gifts.totalHotchpotAddBack.amount > 0 && (
                <>
                  <div className="pt-3 border-t">
                    <div className="text-sm text-slate-600 mb-1">Plus: Gifts (S.35)</div>
                    <div className="text-lg font-semibold text-blue-600">
                      + <MoneyDisplay
                        amount={gifts.totalHotchpotAddBack.amount}
                        currency={gifts.totalHotchpotAddBack.currency}
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t">
                    <div className="text-sm text-slate-600 mb-1">
                      Total Distributable Pool
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      <MoneyDisplay
                        amount={distribution.totalDistributablePool.amount}
                        currency={distribution.totalDistributablePool.currency}
                      />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Readiness Checklist */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Readiness Checklist
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ReadinessChecklist
                checklist={distribution.readinessCheck}
                estateId={estateId}
              />
            </CardContent>
          </Card>
        </div>

        {/* Hotchpot Adjustment (if applicable) */}
        {gifts && gifts.items.length > 0 && (
          <div className="mb-8">
            <HotchpotSummary gifts={gifts} estateId={estateId} />
          </div>
        )}

        {/* Beneficiary Shares */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Beneficiary Shares</h2>
              <p className="text-sm text-slate-600">
                {distribution.shares.length} beneficiary(ies)
              </p>
            </div>
            <Button variant="outline" disabled>
              <Users className="mr-2 h-4 w-4" />
              Add Beneficiary
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {distribution.shares.map((share) => (
              <BeneficiaryShareCard
                key={share.beneficiaryId}
                share={share}
                totalPool={distribution.totalDistributablePool}
              />
            ))}
          </div>

          {distribution.shares.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="h-12 w-12 mx-auto text-slate-400 mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  No Beneficiaries Defined
                </h3>
                <p className="text-slate-600 mb-4">
                  Add beneficiaries to calculate distribution shares
                </p>
                <Button disabled>Add First Beneficiary</Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Distribution Action */}
        {isReady && distribution.shares.length > 0 && (
          <Card className="border-2 border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-900">
                <CheckCircle className="h-5 w-5" />
                Ready to Distribute
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-green-800">
                All prerequisites have been met. You can now proceed with estate distribution 
                according to the calculated shares above.
              </p>

              <div className="flex gap-3">
                <Button className="bg-green-600 hover:bg-green-700">
                  Generate Distribution Schedule
                </Button>
                <Button variant="outline" className="border-green-600 text-green-700">
                  Export to PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Blocked State */}
        {!isReady && (
          <Card className="border-2 border-amber-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-900">
                <XCircle className="h-5 w-5" />
                Distribution Blocked
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-amber-800 mb-4">
                Complete all required steps in the checklist above before proceeding with 
                distribution.
              </p>
              <Button variant="outline" onClick={() => navigate(`/estates/${estateId}`)}>
                Return to Dashboard
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};