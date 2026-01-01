// pages/estate/TaxCompliancePage.tsx

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui';
import { Alert, AlertDescription } from '@/components/ui';
import { Progress } from '@/components/ui';
import { useEstateDashboard, useDebtWaterfall } from '@/features/estate/estate.api';
import { TaxStatusCard, TaxTimeline, MoneyDisplay } from '@/features/estate/components';
import { RecordTaxPaymentDialog } from '@/features/estate/dialogs';

export const TaxCompliancePage: React.FC = () => {
  const { estateId } = useParams<{ estateId: string }>();
  const navigate = useNavigate();

  const { data: dashboard, isLoading: dashboardLoading } = useEstateDashboard(estateId!);
  const { data: debts, isLoading: debtsLoading } = useDebtWaterfall(estateId!);

  if (!estateId) {
    navigate('/estates');
    return null;
  }

  if (dashboardLoading || debtsLoading || !dashboard || !debts) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600">Loading tax information...</p>
        </div>
      </div>
    );
  }

  // Calculate real tax data from Tier 4 (Taxes & Wages) debts
  const taxDebts = debts.tier4_TaxesAndWages;
  const totalAssessment = taxDebts.reduce((sum, d) => sum + d.originalAmount.amount, 0);
  const totalOutstanding = taxDebts.reduce((sum, d) => sum + d.outstandingAmount.amount, 0);
  const totalPaid = totalAssessment - totalOutstanding;

  // Mock clearance data since it's not in the main Debt API
  const taxData = {
    clearanceCertificate: null, // This would come from an API field if available
    paymentDeadline: new Date('2025-06-30'), // Statutory deadline example
  };

  const completionPercentage = totalAssessment > 0 
    ? (totalPaid / totalAssessment) * 100 
    : 0;

  const daysUntilDeadline = Math.ceil(
    (taxData.paymentDeadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  const handleUploadClearance = () => {
    // Placeholder for upload logic dialog
    console.log("Open upload dialog");
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
              <h1 className="text-3xl font-bold text-slate-900">Tax Compliance</h1>
              <p className="text-slate-600 mt-1">
                KRA Assessment & Payment Tracking
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline">
                <FileText className="mr-2 h-4 w-4" />
                Record Assessment
              </Button>
              <RecordTaxPaymentDialog
                estateId={estateId}
                trigger={<Button>Record Payment</Button>}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardDescription>Compliance Status</CardDescription>
              <CardTitle className="flex items-center gap-2">
                {taxData.clearanceCertificate ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-green-600">Cleared</span>
                  </>
                ) : totalOutstanding > 0 ? (
                  <>
                    <Clock className="h-5 w-5 text-amber-600" />
                    <span className="text-amber-600">Pending</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <span className="text-red-600">Overdue</span>
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-slate-600">
                {daysUntilDeadline > 0 ? (
                  <span>{daysUntilDeadline} days until deadline</span>
                ) : (
                  <span className="text-red-600">Deadline passed</span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Assessment Card */}
          <Card>
            <CardHeader>
              <CardDescription>Total Assessment</CardDescription>
              <CardTitle className="text-2xl">
                <MoneyDisplay amount={totalAssessment} currency="KES" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-slate-600">
                Based on recorded Tier 4 debts
              </div>
            </CardContent>
          </Card>

          {/* Outstanding Card */}
          <Card>
            <CardHeader>
              <CardDescription>Outstanding Amount</CardDescription>
              <CardTitle className="text-2xl text-red-600">
                <MoneyDisplay amount={totalOutstanding} currency="KES" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-slate-600">
                Paid: <MoneyDisplay amount={totalPaid} currency="KES" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Bar */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-base">Payment Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Completion</span>
                <span className="font-semibold">{completionPercentage.toFixed(1)}%</span>
              </div>
              <Progress value={completionPercentage} className="h-2" />
              <div className="flex justify-between text-xs text-slate-500">
                <span>
                  <MoneyDisplay amount={totalPaid} currency="KES" /> paid
                </span>
                <span>
                  {/* --- FIX: Removed the 'total' prop from MoneyDisplay --- */}
                  <MoneyDisplay amount={totalAssessment} currency="KES" /> total
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Important Notice */}
        {!taxData.clearanceCertificate && (
          <Alert className="mb-8 border-amber-200 bg-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <strong>Tax Clearance Required:</strong> You must obtain a tax clearance 
              certificate from KRA before distributing the estate. Ensure all outstanding 
              taxes are paid and clearance documentation is uploaded.
            </AlertDescription>
          </Alert>
        )}

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tax Status Details */}
          <div className="space-y-6">
            <TaxStatusCard 
              taxStatus={dashboard.taxStatus}
              outstandingTaxes={{
                amount: totalOutstanding,
                currency: 'KES',
                formatted: `KES ${totalOutstanding.toLocaleString()}`
              }}
              onUploadClearance={handleUploadClearance}
            />

            {/* Breakdown Card */}
            <Card>
              <CardHeader>
                <CardTitle>Assessment Breakdown</CardTitle>
                <CardDescription>
                  Detailed breakdown of recorded tax obligations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {taxDebts.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">No tax assessments recorded.</p>
                  ) : (
                    taxDebts.map(debt => (
                      <div key={debt.id} className="flex justify-between items-center pb-3 border-b last:border-0">
                        <span className="text-slate-600">{debt.description}</span>
                        <span className="font-semibold">
                          <MoneyDisplay amount={debt.originalAmount} />
                        </span>
                      </div>
                    ))
                  )}
                  
                  <div className="flex justify-between items-center pt-2 border-t mt-2">
                    <span className="text-slate-900 font-semibold">Total</span>
                    <span className="text-lg font-bold">
                      <MoneyDisplay amount={totalAssessment} currency="KES" />
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Timeline */}
          <div>
            <TaxTimeline taxDebts={taxDebts} />
          </div>
        </div>

        {/* Actions Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
              <div className="bg-blue-100 p-2 rounded">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-sm">Complete Payment</div>
                <p className="text-sm text-slate-600 mt-1">
                  Pay the outstanding balance of{' '}
                  <MoneyDisplay amount={totalOutstanding} currency="KES" />{' '}
                  before {taxData.paymentDeadline.toLocaleDateString()}
                </p>
              </div>
              <RecordTaxPaymentDialog
                estateId={estateId}
                trigger={<Button size="sm">Record Payment</Button>}
              />
            </div>

            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
              <div className="bg-green-100 p-2 rounded">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-sm">Upload Tax Clearance</div>
                <p className="text-sm text-slate-600 mt-1">
                  Once payment is complete, obtain and upload the clearance certificate
                </p>
              </div>
              <Button size="sm" variant="outline" disabled={totalOutstanding > 0}>
                Upload
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};