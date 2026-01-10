// FILE: src/pages/DashboardHome.tsx

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  ScrollText, 
  Plus, 
  AlertTriangle, 
  ArrowRight, 
  ShieldCheck, 
  Activity,
  Users,
  FileText,
  Scale,
  Briefcase,
  type LucideIcon
} from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

// API Hooks
import { useCurrentUser } from '@/features/user/user.api';
import { useEstateSummary } from '@/features/estate/estate.api';

// --- Local Components ---

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  footer: string;
  icon: LucideIcon; // Strong typing for Lucide icons
  variant?: 'default' | 'dark' | 'light';
  onClick?: () => void;
}

const MetricCard = ({ 
  title, 
  value, 
  subtitle, 
  footer, 
  icon: Icon, 
  variant = 'default',
  onClick 
}: MetricCardProps) => {
  const isDark = variant === 'dark';
  
  return (
    <div 
      onClick={onClick}
      className={`
        group relative overflow-hidden rounded-xl border transition-all cursor-pointer
        ${isDark 
          ? 'bg-[#0F3D3E] border-[#0F3D3E] text-white hover:shadow-xl hover:shadow-[#0F3D3E]/20' 
          : 'bg-white border-slate-200 text-slate-900 hover:border-[#C8A165] hover:shadow-lg'
        }
        hover:-translate-y-1
      `}
    >
      {/* Background Icon Pattern */}
      <div className={`absolute right-0 top-0 h-32 w-32 translate-x-8 translate-y-[-8px] ${isDark ? 'opacity-10' : 'opacity-5 text-[#C8A165]'}`}>
        <Icon className="h-full w-full" />
      </div>

      <div className="p-6 relative z-10">
        <div className={`flex items-center gap-2 text-xs uppercase tracking-wider font-bold mb-3 ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
          <Icon className={`h-4 w-4 ${isDark ? 'text-[#C8A165]' : 'text-[#C8A165]'}`} /> 
          {title}
        </div>
        
        <div className={`text-4xl font-serif font-bold mb-1 ${isDark ? 'text-white' : 'text-[#0F3D3E]'}`}>
          {value}
        </div>
        
        <p className={`text-sm mb-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          {subtitle}
        </p>

        <div className={`flex items-center justify-between border-t pt-4 ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
          <span className={`text-xs font-bold ${isDark ? 'text-[#C8A165]' : 'text-slate-500 group-hover:text-[#C8A165]'} transition-colors`}>
            {footer}
          </span>
          <ArrowRight className={`h-4 w-4 transition-all opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 ${isDark ? 'text-white' : 'text-[#0F3D3E]'}`} />
        </div>
      </div>
    </div>
  );
};

// --- Main Page Component ---

export const DashboardHome: React.FC = () => {
  const { t } = useTranslation(['dashboard', 'common']);
  const navigate = useNavigate();
  
  // 1. Data Fetching
  const { data: user, isLoading: isUserLoading } = useCurrentUser();
  const userId = user?.id;

  const { 
    data: summary, 
    isLoading: isSummaryLoading, 
    isError 
  } = useEstateSummary(userId || '', {
    enabled: !!userId,
  });

  const isLoading = isUserLoading || (!!userId && isSummaryLoading);

  // 2. Loading State
  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center flex-col gap-4">
        <LoadingSpinner size="lg" />
        <p className="text-sm font-medium text-slate-500 animate-pulse">Synchronizing Secure Data...</p>
      </div>
    );
  }

  // 3. Determine View State
  // FIXED: Removed check for 'heirCount' to resolve TS error. 
  // We rely on 'assetCount' to determine if the estate has been started.
  const hasActiveEstate = summary && !isError && (summary.stats?.assetCount > 0);

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-12">
      
      {/* HEADER */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between border-b border-slate-200 pb-6">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-[#0F3D3E]">
            {t('dashboard:welcome', 'Karibu, {{name}}', { name: user?.firstName || 'User' })}
          </h1>
          <p className="text-slate-600 mt-2 max-w-2xl text-lg">
            {hasActiveEstate 
              ? 'Here is the current standing of your estate administration.'
              : 'Let’s secure your family legacy. Select a starting point below.'}
          </p>
        </div>
        
        {/* Verification Status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200">
           <ShieldCheck className="h-4 w-4 text-emerald-600" />
           <span className="text-xs font-semibold text-slate-700">Identity Verified</span>
        </div>
      </div>

      {/* =========================================================================
          SCENARIO A: ZERO STATE (ONBOARDING)
      ========================================================================= */}
      {!hasActiveEstate && (
        <>
          <div className="grid gap-8 md:grid-cols-2">
            
            {/* PATH 1: FAMILY PLANNING */}
            <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-md hover:border-[#0F3D3E]/30">
              <div className="absolute top-0 right-0 -mr-6 -mt-6 h-32 w-32 rounded-full bg-emerald-50 transition-transform group-hover:scale-110" />
              
              <div className="relative">
                <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800 shadow-sm">
                  <Users className="h-7 w-7" />
                </div>
                
                <h3 className="text-xl font-bold text-[#0F3D3E] mb-3">
                  Establish Family Lineage
                </h3>
                <p className="text-slate-600 leading-relaxed mb-8 min-h-[48px]">
                  Map out your family tree and potential beneficiaries. Vital for preventing disputes and honoring your wishes.
                </p>
                
                <Button 
                  asChild 
                  variant="outline" 
                  className="w-full border-slate-300 text-slate-700 hover:border-[#0F3D3E] hover:text-[#0F3D3E] h-12"
                >
                  <Link to="/dashboard/family/tree">
                    Start Family Tree <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* PATH 2: ESTATE ADMINISTRATION */}
            <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-md hover:border-[#C8A165]/50">
              <div className="absolute top-0 right-0 -mr-6 -mt-6 h-32 w-32 rounded-full bg-[#C8A165]/10 transition-transform group-hover:scale-110" />
              
              <div className="relative">
                <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#C8A165]/20 text-[#8a6a35] shadow-sm">
                  <Briefcase className="h-7 w-7" />
                </div>
                
                <h3 className="text-xl font-bold text-[#0F3D3E] mb-3">
                  Register Estate Assets
                </h3>
                <p className="text-slate-600 leading-relaxed mb-8 min-h-[48px]">
                  Begin the inventory process. Record assets, debts, and generate a preliminary Net Worth statement.
                </p>
                
                <Button 
                  asChild 
                  className="w-full bg-[#0F3D3E] hover:bg-[#0F3D3E]/90 text-white h-12 shadow-lg shadow-[#0F3D3E]/10"
                >
                  <Link to="/dashboard/estate">
                    <Plus className="mr-2 h-4 w-4" /> Start Inventory
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* EDUCATIONAL FOOTER */}
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-6 flex items-start gap-4">
            <Scale className="h-6 w-6 text-slate-400 mt-1 flex-shrink-0" />
            <div>
              <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wide">Legal Process Guide</h4>
              <p className="mt-2 text-sm text-slate-600 max-w-3xl leading-relaxed">
                Succession in Kenya is strictly governed by the <strong>Law of Succession Act (Cap 160)</strong>. 
                Whether you are planning ahead or administering an estate, Mirathi ensures every step is compliant 
                with judiciary requirements.
              </p>
              <div className="mt-4">
                 <Link to="/resources/guide" className="text-[#0F3D3E] text-sm font-bold hover:underline inline-flex items-center gap-1">
                   Read the Complete Guide <ArrowRight className="h-3 w-3" />
                 </Link>
              </div>
            </div>
          </div>
        </>
      )}

      {/* =========================================================================
          SCENARIO B: COMMAND CENTER (ACTIVE)
      ========================================================================= */}
      {hasActiveEstate && summary && (
        <div className="space-y-8">
          
          {/* TOP METRICS */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            
            {/* 1. ASSETS (Dark Card) */}
            <MetricCard 
              variant="dark"
              title="Estate Inventory"
              value={summary.stats.assetCount}
              subtitle="Assets Verified"
              footer={`${new Intl.NumberFormat('en-KE', { 
                style: 'currency', 
                currency: summary.overview.currency 
              }).format(summary.overview.netWorth)} Net Value`}
              icon={Briefcase}
              onClick={() => navigate('/dashboard/estate')}
            />

            {/* 2. SUCCESSION (Light Card) */}
            <MetricCard 
              variant="light"
              title="Succession Plan"
              value="Active"
              subtitle="Will & Testament"
              footer="Review Documents"
              icon={ScrollText}
              onClick={() => navigate('/dashboard/estate/will')}
            />

            {/* 3. LEGAL INSIGHTS (Panel) */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-bold text-slate-500 mb-4">
                  <Activity className="h-4 w-4 text-emerald-600" /> System Analysis
                </div>

                <div className="space-y-4">
                  {/* Solvency */}
                  <div className="flex gap-3 items-start p-3 bg-white rounded-lg border border-slate-100 shadow-sm">
                    <div className={`mt-0.5 rounded-full p-1.5 ${summary.overview.isInsolvent ? 'bg-red-50' : 'bg-emerald-50'}`}>
                      {summary.overview.isInsolvent ? (
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      ) : (
                        <ShieldCheck className="h-4 w-4 text-emerald-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        {summary.overview.isInsolvent ? 'Estate Insolvent' : 'Estate Solvent'}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {summary.overview.isInsolvent 
                          ? 'Debts exceed assets.' 
                          : 'Assets cover recorded debts.'}
                      </p>
                    </div>
                  </div>

                  {/* Recommended Form */}
                  <div className="flex gap-3 items-start p-3 bg-white rounded-lg border border-slate-100 shadow-sm">
                    <div className="mt-0.5 rounded-full bg-blue-50 p-1.5">
                      <FileText className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">Required Petition Form</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Based on value: <strong className="text-slate-700">{summary.legalInsights.recommendedForm || 'P&A 80'}</strong>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-slate-200 mt-4">
                <Link to="/dashboard/estate" className="text-xs font-bold text-[#0F3D3E] hover:underline flex items-center justify-end gap-1">
                  View Full Report <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>

          </div>
          
          {/* QUICK ACTIONS ROW */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
             <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">
               Quick Actions
             </h3>
             <div className="flex gap-3">
               <Button 
                 variant="outline" 
                 size="sm"
                 onClick={() => navigate('/dashboard/family')}
                 className="text-slate-600 border-slate-300"
               >
                 <Users className="mr-2 h-4 w-4" /> Add Beneficiary
               </Button>
               <Button 
                 size="sm"
                 onClick={() => navigate('/dashboard/estate')}
                 className="bg-[#0F3D3E] hover:bg-[#0F3D3E]/90 text-white"
               >
                 <Plus className="mr-2 h-4 w-4" /> Add Asset
               </Button>
             </div>
          </div>

        </div>
      )}
    </div>
  );
};