import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Building2, Wallet, AlertTriangle, ArrowRight, Gavel } from 'lucide-react';

import { useEstateDashboard } from '../../features/estate/estate.api';
import { SolvencyRadarWidget } from '../../features/estate/components/SolvencyRadarWidget';
import { AddAssetDialog } from '../../features/estate/components/AddAssetDialog';
// Assuming we have a similar dialog for Debts, or we link to the debts page
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/Tabs';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Badge } from '../../components/ui/Badge';

export function EstateDashboardPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: dashboard, isLoading } = useEstateDashboard(id || '');

  if (isLoading || !dashboard) return <div className="h-screen flex items-center justify-center"><LoadingSpinner /></div>;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">{dashboard.name}</h1>
            <Badge variant={dashboard.isFrozen ? 'destructive' : 'outline'}>
              {dashboard.status}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Deceased: {dashboard.deceasedName} • Date of Death: {new Date(dashboard.dateOfDeath).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
           {/* Quick Actions */}
           <AddAssetDialog estateId={dashboard.id} />
           <Button variant="outline" onClick={() => navigate(`/dashboard/estate/${id}/debts`)}>
             Record Liability
           </Button>
        </div>
      </div>

      {/* Tabs for Navigation (acting as sub-menu) */}
      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList>
          <TabsTrigger value="dashboard">Overview</TabsTrigger>
          <TabsTrigger value="assets" onClick={() => navigate(`/dashboard/estate/${id}/assets`)}>Assets Registry</TabsTrigger>
          <TabsTrigger value="debts" onClick={() => navigate(`/dashboard/estate/${id}/debts`)}>Liabilities (S.45)</TabsTrigger>
          <TabsTrigger value="distribution" onClick={() => navigate(`/dashboard/estate/${id}/distribution`)}>Distribution</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        
        {/* Left Column: Financial Radar */}
        <div className="lg:col-span-1">
          <SolvencyRadarWidget estateId={dashboard.id} />
        </div>

        {/* Right Column: Stats & Breakdown */}
        <div className="lg:col-span-2 space-y-6">
           
           {/* Net Worth Cards */}
           <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Gross Assets</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboard.grossAssets.formatted}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Liabilities</CardTitle>
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    -{dashboard.totalLiabilities.formatted}
                  </div>
                </CardContent>
              </Card>
              <Card className={dashboard.isSolvent ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Net Estate Value</CardTitle>
                  <Gavel className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboard.netWorth.formatted}</div>
                </CardContent>
              </Card>
           </div>

           {/* Alerts Banner */}
           {dashboard.isFrozen && (
             <div className="bg-red-100 border-l-4 border-red-500 p-4 rounded-r shadow-sm flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-700 mt-0.5" />
                <div>
                  <h4 className="font-bold text-red-800">Estate Frozen</h4>
                  <p className="text-sm text-red-700">
                    This estate is currently frozen by Court Order or Dispute. Assets cannot be distributed.
                  </p>
                </div>
             </div>
           )}

           {/* Call to Action */}
           <Card className="bg-slate-900 text-white">
             <CardContent className="pt-6 flex justify-between items-center">
               <div>
                 <h3 className="font-bold text-lg">Ready for Distribution?</h3>
                 <p className="text-slate-300 text-sm">
                   Run the readiness check to see if you can file Form P&A 5.
                 </p>
               </div>
               <Button variant="secondary" onClick={() => navigate(`/dashboard/succession`)}>
                 Check Readiness <ArrowRight className="ml-2 h-4 w-4" />
               </Button>
             </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}