// FILE: src/pages/DashboardHome.tsx

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Building2, 
  ScrollText, 
  Plus, 
  AlertTriangle, 
  ArrowRight, 
  ShieldCheck, 
  Activity,
  Users,
  FileText,
  Scale
} from 'lucide-react';

import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

// API Hooks
import { useCurrentUser } from '../features/user/user.api';
import { useEstateSummary } from '../features/estate/estate.api';

export const DashboardHome: React.FC = () => {
  const { t } = useTranslation(['dashboard', 'common']);
  const navigate = useNavigate();
  
  // 1. Fetch Context
  const { data: user, isLoading: isUserLoading } = useCurrentUser();
  const userId = user?.id;

  // 2. Fetch Estate Data
  // If this fails (404), it means the user hasn't set up an estate yet.
  const { 
    data: summary, 
    isLoading: isSummaryLoading, 
    isError 
  } = useEstateSummary(userId || '', {
    enabled: !!userId,
  });

  const isLoading = isUserLoading || (!!userId && isSummaryLoading);

  // 3. Loading State
  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <LoadingSpinner size="lg" text="Synchronizing Mirathi Intelligence Engine..." />
      </div>
    );
  }

  // 4. DETERMINE STATE: New User vs. Returning User
  // If we have summary data, show the Command Center.
  // If we have an error (404) or no data, show the Onboarding Cards.
  const hasActiveEstate = summary && !isError;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-[#0F3D3E]">
            {t('dashboard:welcome', 'Karibu, {{name}}', { name: user?.firstName || 'User' })}
          </h1>
          <p className="text-neutral-600 mt-1">
            {hasActiveEstate 
              ? 'Securely managing your estate succession workflow.'
              : 'Let’s get your family legacy secured. Where would you like to start?'}
          </p>
        </div>
        
        {/* Verification Badge */}
        <div className="hidden md:block">
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 border border-emerald-100">
            <ShieldCheck className="h-3 w-3" />
            <span>Identity Verified</span>
          </span>
        </div>
      </div>

      {/* =========================================================================
          SCENARIO A: ZERO STATE (ONBOARDING)
          User has no data -> Show clear paths to get started
      ========================================================================= */}
      {!hasActiveEstate && (
        <>
          <div className="grid gap-6 md:grid-cols-2">
            
            {/* PATH 1: FAMILY PLANNING */}
            <div className="group relative overflow-hidden rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-[#0F3D3E]/30">
              <div className="absolute top-0 right-0 -mr-4 -mt-4 h-24 w-24 rounded-full bg-emerald-50 transition-transform group-hover:scale-110" />
              
              <div className="relative">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <Users className="h-6 w-6" />
                </div>
                
                <h3 className="text-lg font-bold text-[#0F3D3E]">
                  Establish Family Structure
                </h3>
                <p className="mt-2 text-sm text-neutral-600 leading-relaxed min-h-[60px]">
                  Map out your family tree and potential beneficiaries. This is vital for preventing future disputes and ensuring your wishes are honored.
                </p>
                
                <div className="mt-6">
                  <Button 
                    asChild 
                    variant="outline" 
                    className="w-full border-neutral-200 hover:border-[#0F3D3E] hover:bg-emerald-50/50 hover:text-[#0F3D3E]"
                  >
                    <Link to="/dashboard/family/tree">
                      Start Family Tree <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>

            {/* PATH 2: ESTATE ADMINISTRATION */}
            <div className="group relative overflow-hidden rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-[#C8A165]/50">
              <div className="absolute top-0 right-0 -mr-4 -mt-4 h-24 w-24 rounded-full bg-amber-50 transition-transform group-hover:scale-110" />
              
              <div className="relative">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                  <FileText className="h-6 w-6" />
                </div>
                
                <h3 className="text-lg font-bold text-[#0F3D3E]">
                  Register an Estate
                </h3>
                <p className="mt-2 text-sm text-neutral-600 leading-relaxed min-h-[60px]">
                  Are you an Executor? Begin the succession process for a deceased loved one. Inventory assets, debts, and generate court forms.
                </p>
                
                <div className="mt-6">
                  <Button 
                    asChild 
                    className="w-full bg-[#0F3D3E] hover:bg-[#0F3D3E]/90 text-white"
                  >
                    <Link to="/dashboard/estate">
                      <Plus className="mr-2 h-4 w-4" /> Register Estate
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* EDUCATIONAL CONTEXT */}
          <div className="rounded-xl bg-slate-50 border border-slate-100 p-6">
            <div className="flex items-start gap-4">
              <Scale className="h-6 w-6 text-slate-400 mt-1" />
              <div>
                <h4 className="font-semibold text-slate-900">Understanding the Process</h4>
                <p className="mt-1 text-sm text-slate-600 max-w-3xl">
                  Succession in Kenya is governed by the <strong>Law of Succession Act (Cap 160)</strong>. 
                  Whether you are planning ahead or administering an estate, Mirathi ensures every step is compliant 
                  with the judiciary requirements.
                </p>
                <div className="mt-4 flex gap-4 text-sm">
                  <Link to="/how-it-works" className="text-[#0F3D3E] font-medium hover:underline">
                    Read the Guide
                  </Link>
                  <span className="text-slate-300">|</span>
                  <Link to="/dashboard/documents" className="text-[#0F3D3E] font-medium hover:underline">
                    View Required Documents
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* =========================================================================
          SCENARIO B: COMMAND CENTER (ACTIVE)
          User has estate data -> Show Portfolio & Analytics
      ========================================================================= */}
      {hasActiveEstate && summary && (
        <div className="space-y-8">
          
          {/* ACTION BAR */}
          <div className="flex justify-end">
             <Button 
              onClick={() => navigate('/dashboard/estate')}
              className="bg-[#C8A165] hover:bg-[#b08d55] text-[#0F3D3E] font-bold shadow-md"
            >
              <Plus className="mr-2 h-4 w-4" /> Manage Estate
            </Button>
          </div>

          {/* METRIC CARDS */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            
            {/* CARD 1: ESTATE ASSETS (Net Worth) */}
            <div 
              onClick={() => navigate('/dashboard/estate')}
              className="group relative overflow-hidden rounded-xl border-none bg-[#0F3D3E] text-white cursor-pointer transition-all hover:shadow-xl hover:shadow-[#0F3D3E]/20 hover:-translate-y-1"
            >
              {/* Pattern */}
              <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 translate-y-[-8px] opacity-10">
                <Building2 className="h-full w-full" />
              </div>

              <div className="p-6">
                <div className="flex items-center gap-2 text-neutral-300 text-sm uppercase tracking-wider font-medium mb-2">
                  <Building2 className="h-4 w-4 text-[#C8A165]" /> Estate Assets
                </div>
                
                <div className="text-4xl font-serif font-bold text-white mb-1">
                  {summary.stats.assetCount}
                </div>
                <p className="text-neutral-400 text-sm mb-6">
                  Assets Inventoried
                </p>

                <div className="flex items-center justify-between border-t border-white/10 pt-4">
                  <span className="text-xs font-medium text-[#C8A165]">
                    {new Intl.NumberFormat('en-KE', { 
                      style: 'currency', 
                      currency: summary.overview.currency 
                    }).format(summary.overview.netWorth)} Net Worth
                  </span>
                  <ArrowRight className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1" />
                </div>
              </div>
            </div>

            {/* CARD 2: SUCCESSION PLAN */}
            <div 
              onClick={() => navigate('/dashboard/estate/will')}
              className="group relative overflow-hidden rounded-xl border border-neutral-200 bg-white cursor-pointer transition-all hover:border-[#C8A165] hover:shadow-lg hover:-translate-y-1"
            >
              <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 translate-y-[-8px] opacity-5 text-[#C8A165]">
                <ScrollText className="h-full w-full" />
              </div>

              <div className="p-6">
                <div className="flex items-center gap-2 text-neutral-500 text-sm uppercase tracking-wider font-medium mb-2">
                  <ScrollText className="h-4 w-4 text-[#C8A165]" /> Succession Plan
                </div>
                
                <div className="text-4xl font-serif font-bold text-[#0F3D3E] mb-1">
                  Active
                </div>
                <p className="text-neutral-500 text-sm mb-6">
                  Will & Testament Status
                </p>

                <div className="flex items-center justify-between border-t border-neutral-100 pt-4">
                  <span className="text-xs font-medium text-neutral-500 group-hover:text-[#C8A165] transition-colors">
                    Review Document
                  </span>
                  <ArrowRight className="h-4 w-4 text-[#0F3D3E] opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1" />
                </div>
              </div>
            </div>

            {/* CARD 3: LEGAL INSIGHTS (Copilot) */}
            <div className="rounded-xl border border-neutral-200 bg-[#F8F9FA] p-6">
              <div className="flex items-center gap-2 text-neutral-500 text-sm uppercase tracking-wider font-medium mb-4">
                <Activity className="h-4 w-4 text-blue-600" /> Legal Insights
              </div>

              <div className="space-y-4">
                {/* Solvency Check */}
                <div className="flex gap-3 items-start">
                  <div className={`mt-0.5 rounded-full p-1 ${summary.overview.isInsolvent ? 'bg-red-100' : 'bg-green-100'}`}>
                    {summary.overview.isInsolvent ? (
                      <AlertTriangle className="h-3 w-3 text-red-600" />
                    ) : (
                      <ShieldCheck className="h-3 w-3 text-green-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#0F3D3E]">
                      {summary.overview.isInsolvent ? 'Estate Insolvent' : 'Estate Solvent'}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {summary.overview.isInsolvent 
                        ? 'Liabilities exceed assets. Section 45 rules apply.' 
                        : 'Assets cover all recorded debts.'}
                    </p>
                  </div>
                </div>

                {/* Form Recommendation */}
                <div className="flex gap-3 items-start">
                  <div className="mt-0.5 rounded-full bg-blue-100 p-1">
                    <FileText className="h-3 w-3 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#0F3D3E]">Recommended Form</p>
                    <p className="text-xs text-neutral-500">
                      Based on estate value: <strong>{summary.legalInsights.recommendedForm}</strong>
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};