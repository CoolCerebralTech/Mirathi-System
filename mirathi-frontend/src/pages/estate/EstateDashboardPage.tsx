import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Briefcase, 
  FileText, 
  Gavel, 
  TrendingUp, 
  ChevronRight, 
  AlertTriangle 
} from 'lucide-react';

import { Card, CardContent } from '../../components/ui';
import { LoadingSpinner } from '../../components/common';

// Feature Components
import { EstateHeader } from '../../features/estate/components/shared/EstateHeader';
import { EstateSummaryCards } from '../../features/estate/components/dashboard/EstateSummaryCards';
import { SolvencyWidget } from '../../features/estate/components/dashboard/SolvencyWidget';
import { CashFlowWidget } from '../../features/estate/components/dashboard/CashFlowWidget';
import { QuickActions } from '../../features/estate/components/dashboard/QuickActions';
import { RecentActivity } from '../../features/estate/components/dashboard/RecentActivity';

// Dialogs
import { AddAssetDialog } from '../../features/estate/dialogs/AddAssetDialog';
import { AddDebtDialog } from '../../features/estate/dialogs/AddDebtDialog';
import { AddDependantDialog } from '../../features/estate/dialogs/AddDependantDialog';
import { AddGiftDialog } from '../../features/estate/dialogs/AddGiftDialog';

// API
import { useEstateDashboard } from '../../features/estate/estate.api';

export const EstateDashboardPage: React.FC = () => {
  const { id: estateId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // Dialog State Management
  const [activeDialog, setActiveDialog] = useState<string | null>(null);

  // Data Fetching
  const { data: dashboard, isLoading } = useEstateDashboard(estateId!);

  if (isLoading || !dashboard || !estateId) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <LoadingSpinner size="lg" text="Loading estate context..." />
      </div>
    );
  }

  // Navigation Helper
  const navTo = (path: string) => navigate(`/estates/${estateId}/${path}`);

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      
      {/* 1. Top Navigation & Context */}
      <EstateHeader estate={dashboard} />

      <main className="mx-auto max-w-7xl p-6 space-y-6">
        
        {/* 2. Key Figures (Net Worth, Assets, Liabilities) */}
        <EstateSummaryCards data={dashboard} />

        <div className="grid gap-6 lg:grid-cols-3">
          
          {/* 3. Main Operational Column (Left - 2/3 width) */}
          <div className="space-y-6 lg:col-span-2">
            
            {/* Navigation Cards (Modules) */}
            <div className="grid grid-cols-2 gap-4">
                <ModuleCard 
                    icon={TrendingUp} 
                    title="Asset Inventory" 
                    description="Real Estate, Vehicles, Cash"
                    onClick={() => navTo('assets')} 
                    color="text-green-600"
                    bg="bg-green-50"
                />
                <ModuleCard 
                    icon={Briefcase} 
                    title="Debt Management" 
                    description="S.45 Priority Waterfall"
                    onClick={() => navTo('debts')} 
                    color="text-red-600"
                    bg="bg-red-50"
                />
                <ModuleCard 
                    icon={FileText} 
                    title="Tax Compliance" 
                    description="Clearance & Filings"
                    onClick={() => navTo('tax')} 
                    color="text-blue-600"
                    bg="bg-blue-50"
                />
                <ModuleCard 
                    icon={Gavel} 
                    title="Distribution" 
                    description="Beneficiaries & Shares"
                    onClick={() => navTo('distribution')} 
                    color="text-purple-600"
                    bg="bg-purple-50"
                />
            </div>

            {/* Financial Health */}
            <div className="grid gap-6 md:grid-cols-2">
                <SolvencyWidget estateId={estateId} />
                <CashFlowWidget data={dashboard} />
            </div>

            {/* Audit Trail */}
            <RecentActivity />
          </div>

          {/* 4. Sidebar Column (Right - 1/3 width) */}
          <div className="space-y-6">
            
            {/* Actions Panel */}
            <QuickActions onAction={setActiveDialog} />

            {/* Warnings / Alerts Container */}
            {dashboard.isFrozen && (
                <Card className="border-red-200 bg-red-50">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
                            <div>
                                <h4 className="font-semibold text-red-900">Estate is Frozen</h4>
                                <p className="text-sm text-red-700 mt-1">
                                    {dashboard.freezeReason || "Administrative hold active."}
                                </p>
                                <p className="text-xs text-red-600 mt-2">
                                    Assets cannot be sold and debts cannot be paid until unfrozen.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Progress Status */}
            <Card>
                <CardContent className="pt-6">
                    <h4 className="text-sm font-semibold mb-2">Administration Progress</h4>
                    <div className="flex items-end gap-2">
                        <span className="text-3xl font-bold">{dashboard.administrationProgress}%</span>
                        <span className="text-sm text-muted-foreground mb-1">Complete</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full mt-2 overflow-hidden">
                        <div 
                            className="h-full bg-slate-900 transition-all duration-1000" 
                            style={{ width: `${dashboard.administrationProgress}%` }} 
                        />
                    </div>
                </CardContent>
            </Card>

          </div>
        </div>
      </main>

      {/* ------------------------------------------------------------------ */}
      {/* Dialogs Layer */}
      {/* ------------------------------------------------------------------ */}
      
      <AddAssetDialog 
        open={activeDialog === 'ADD_ASSET'} 
        onOpenChange={(open) => !open && setActiveDialog(null)}
        estateId={estateId} 
      />

      <AddDebtDialog 
        open={activeDialog === 'ADD_DEBT'} 
        onOpenChange={(open) => !open && setActiveDialog(null)}
        estateId={estateId} 
      />

      <AddDependantDialog
        open={activeDialog === 'FILE_CLAIM'}
        onOpenChange={(open) => !open && setActiveDialog(null)}
        estateId={estateId}
      />

      <AddGiftDialog
        open={activeDialog === 'ADD_GIFT'}
        onOpenChange={(open) => !open && setActiveDialog(null)}
        estateId={estateId}
      />

      {/* Note: 'PAY_DEBT' and 'TAX_PAYMENT' are usually context-specific 
          and might redirect to the specific page or open a selector dialog first. 
          For brevity, we handle the main creation actions here. */}

    </div>
  );
};

// Local Component for the Navigation Grid
const ModuleCard = ({ 
    icon: Icon, title, description, onClick, color, bg 
}: { 
    icon: any, title: string, description: string, onClick: () => void, color: string, bg: string 
}) => (
    <div 
        onClick={onClick}
        className="group relative flex cursor-pointer items-center justify-between overflow-hidden rounded-xl border bg-white p-4 transition-all hover:border-primary/50 hover:shadow-md"
    >
        <div className="flex items-center gap-4">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${bg} ${color}`}>
                <Icon className="h-5 w-5" />
            </div>
            <div>
                <h3 className="font-semibold text-slate-900">{title}</h3>
                <p className="text-xs text-muted-foreground">{description}</p>
            </div>
        </div>
        <ChevronRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-primary" />
    </div>
);