// ============================================================================
// FILE: DashboardHome.tsx
// ============================================================================

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  ScrollText, 
  Plus, 
  AlertTriangle, 
  ArrowRight,
  ShieldCheck,
  Activity,
  Loader2
} from 'lucide-react';

import { Button, Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
// Using the unified API features
import { useCurrentUser } from '@/features/user/user.api'; // Ensure this path is correct
import { useEstateSummary } from '@/features/estate/estate.api';

export const DashboardHome: React.FC = () => {
  const navigate = useNavigate();
  
  // 1. Get User
  const { data: currentUser, isLoading: isUserLoading } = useCurrentUser();
  const userId = currentUser?.id;

  // 2. Get Estate Data
  const { 
    data: summary, 
    isLoading: isSummaryLoading, 
    isError 
  } = useEstateSummary(userId || '', {
    enabled: !!userId
  });

  const isLoading = isUserLoading || isSummaryLoading;

  // 3. The "Golden Entry" Logic (Redirect if empty)
  useEffect(() => {
    if (!isLoading && userId) {
      // If we have a user but no summary (404) or error, 
      // it means they haven't set up the estate/will yet.
      // Redirect to Onboarding to choose path.
      if (!summary || isError) {
        // You might want to be more specific with the error check (e.g. 404)
        // For now, redirecting on error ensures they create an estate.
        navigate('/onboarding', { replace: true });
      }
    }
  }, [summary, isLoading, isError, userId, navigate]);

  // 4. Loading State
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F8F9FA]">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-[#C8A165] mx-auto" />
          <p className="text-xs text-muted-foreground font-medium tracking-widest uppercase">
            Synchronizing Mirathi Intelligence Engine...
          </p>
        </div>
      </div>
    );
  }

  // Prevent flash if redirecting
  if (!summary) return null;

  // DESTRUCTURE NESTED DATA HERE
  const { overview, stats } = summary;

  // 5. THE COMMAND CENTER UI
  return (
    <div className="container mx-auto p-6 space-y-8 animate-in fade-in duration-500">
      
      {/* SECTION A: HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-[#0F3D3E]">
            Good morning, {currentUser?.firstName || 'User'}.
          </h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            System Status: <span className="text-emerald-700 font-medium">Operational & Secure</span>
          </p>
        </div>
        
        {/* Quick Action Button */}
        <Button 
          onClick={() => navigate('/dashboard/estate')}
          className="bg-[#C8A165] hover:bg-[#b08d55] text-[#0F3D3E] font-bold shadow-lg"
        >
          <Plus className="mr-2 h-4 w-4" /> Go to Estate Dashboard
        </Button>
      </div>

      {/* SECTION B: PORTFOLIO CARDS */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        
        {/* CARD 1: ESTATE ADMINISTRATION */}
        <div 
          onClick={() => navigate('/dashboard/estate')}
          className="group relative overflow-hidden rounded-xl border-none bg-[#0F3D3E] text-white cursor-pointer transition-all hover:shadow-xl hover:shadow-[#0F3D3E]/20 hover:-translate-y-1"
        >
          {/* Background Pattern */}
          <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 translate-y-[-8px] opacity-10">
            <Building2 className="h-full w-full" />
          </div>

          <div className="p-6">
            <div className="flex items-center gap-2 text-neutral-300 text-sm uppercase tracking-wider font-medium mb-2">
              <Building2 className="h-4 w-4 text-[#C8A165]" /> Estate Assets
            </div>
            
            <div className="text-4xl font-serif font-bold text-white mb-1">
              {stats.assetCount} {/* Use stats.assetCount */}
            </div>
            <p className="text-neutral-400 text-sm mb-6">
              Total Assets Recorded
            </p>

            <div className="flex items-center justify-between border-t border-white/10 pt-4">
              <span className="text-xs font-medium text-[#C8A165]">
                {new Intl.NumberFormat('en-KE', { style: 'currency', currency: overview.currency }).format(overview.netWorth)} Net Worth
              </span> {/* Use overview.currency and overview.netWorth */}
              <ArrowRight className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1" />
            </div>
          </div>
        </div>

        {/* CARD 2: MY WILLS / LEGACY */}
        <div 
          onClick={() => navigate('/dashboard/estate/will')}
          className="group relative overflow-hidden rounded-xl border-2 border-transparent bg-white cursor-pointer transition-all hover:border-[#C8A165] hover:shadow-xl hover:-translate-y-1"
        >
           {/* Background Pattern */}
           <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 translate-y-[-8px] opacity-5 text-[#C8A165]">
            <ScrollText className="h-full w-full" />
          </div>

          <div className="p-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm uppercase tracking-wider font-medium mb-2">
              <ScrollText className="h-4 w-4 text-[#C8A165]" /> Succession Plan
            </div>
            
            <div className="text-4xl font-serif font-bold text-[#0F3D3E] mb-1">
              Active
            </div>
            <p className="text-muted-foreground text-sm mb-6">
              Will & Testament Status
            </p>

            <div className="flex items-center justify-between border-t border-neutral-100 pt-4">
              <span className="text-xs font-medium text-muted-foreground group-hover:text-[#C8A165] transition-colors">
                Manage Will
              </span>
              <ArrowRight className="h-4 w-4 text-[#0F3D3E] opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1" />
            </div>
          </div>
        </div>

        {/* CARD 3: SYSTEM ALERTS / INSIGHTS */}
        <Card className="border-neutral-200 bg-[#F8F9FA]">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-muted-foreground text-sm uppercase tracking-wider font-medium">
              <Activity className="h-4 w-4 text-blue-600" /> Copilot Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Solvency Alert */}
              <div className="flex gap-3 items-start">
                <div className={`mt-0.5 rounded-full p-1 ${overview.isInsolvent ? 'bg-red-100' : 'bg-green-100'}`}>
                  {overview.isInsolvent ? (
                    <AlertTriangle className="h-3 w-3 text-red-600" />
                  ) : (
                    <ShieldCheck className="h-3 w-3 text-green-600" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#0F3D3E]">
                    {overview.isInsolvent ? 'Estate Insolvent' : 'Estate Solvent'} {/* Use overview.isInsolvent */}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {overview.isInsolvent 
                      ? 'Debts exceed assets. Section 45 rules apply.' 
                      : 'Assets cover all recorded liabilities.'}
                  </p>
                </div>
              </div>
              
              {/* Asset Alert */}
              <div className="flex gap-3 items-start">
                <div className="mt-0.5 rounded-full bg-blue-100 p-1">
                  <Activity className="h-3 w-3 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#0F3D3E]">Debt Overview</p>
                  <p className="text-xs text-muted-foreground">
                    {stats.debtCount} liabilities recorded against estate. {/* Use stats.debtCount */}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};