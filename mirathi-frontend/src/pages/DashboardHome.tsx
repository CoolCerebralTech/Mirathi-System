// FILE: src/pages/DashboardHome.tsx
// CONTEXT: The Command Center (Post-Onboarding)
// DESIGN: High-Density Information, "Old Money" Aesthetic

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Building2, 
  ScrollText, 
  Plus, 
  TrendingUp, 
  AlertTriangle, 
  ArrowRight,
  ShieldCheck,
  Activity
} from 'lucide-react';

import { apiClient } from '@/api/client';
import { LoadingSpinner } from '@/components/common';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useCurrentUser } from '@/store/auth.store'; // Assuming you have this

// Types for the API response
interface UserStats {
  estateCount: number;
  willCount: number;
  // Future-proofing: these fields might come from backend later
  totalValueManaged?: number; 
  pendingTasks?: number;
}

export const DashboardHome: React.FC = () => {
  const navigate = useNavigate();
  const user = useCurrentUser();

  // 1. Fetch Portfolio Stats
  const { data, isLoading, isError } = useQuery({
    queryKey: ['user-stats'],
    queryFn: async () => {
      const res = await apiClient.get<UserStats>('/account/stats'); 
      return res.data;
    },
    retry: 1,
  });

  // 2. The "Golden Entry" Logic (Redirect if empty)
  useEffect(() => {
    if (!isLoading) {
      // If user has NO data, send them to the Wizard to start fresh
      if ((data && data.estateCount === 0 && data.willCount === 0) || isError) {
        navigate('/onboarding', { replace: true });
      }
    }
  }, [data, isLoading, isError, navigate]);

  // 3. Loading State
  if (isLoading || (!data && !isError)) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F8F9FA]">
        <div className="text-center">
          <LoadingSpinner text="Synchronizing Portfolio..." />
          <p className="mt-4 text-xs text-neutral-400 font-medium tracking-widest uppercase">
            Mirathi Intelligence Engine
          </p>
        </div>
      </div>
    );
  }

  // 4. Prevent Flash if redirecting
  if ((data && data.estateCount === 0 && data.willCount === 0) || isError) {
    return null; 
  }

  // 5. THE COMMAND CENTER UI
  return (
    <div className="p-6 space-y-8 animate-fade-in">
      
      {/* SECTION A: HEADER & ECONOMIC TRUTH */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-[#0F3D3E]">
            Good morning, {user?.firstName || 'Administrator'}.
          </h1>
          <p className="text-neutral-500 mt-1 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            System Status: <span className="text-emerald-700 font-medium">Operational & Secure</span>
          </p>
        </div>
        
        {/* Quick Action Button */}
        <Button 
          onClick={() => navigate('/dashboard/estates/new')}
          className="bg-[#C8A165] hover:bg-[#b08d55] text-[#0F3D3E] font-bold shadow-lg"
        >
          <Plus className="mr-2 h-4 w-4" /> Initiate New Estate
        </Button>
      </div>

      {/* SECTION B: PORTFOLIO CARDS */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        
        {/* CARD 1: ESTATE ADMINISTRATION (The Engine) */}
        <Card 
          onClick={() => navigate('/dashboard/estates')}
          className="group relative overflow-hidden border-none bg-[#0F3D3E] text-white cursor-pointer transition-all hover:shadow-xl hover:shadow-[#0F3D3E]/20 hover:-translate-y-1"
        >
          {/* Background Pattern */}
          <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 translate-y-[-8px] opacity-10">
            <Building2 className="h-full w-full" />
          </div>

          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-neutral-300 text-sm uppercase tracking-wider font-medium">
              <Building2 className="h-4 w-4 text-[#C8A165]" /> Estates Managed
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            <div className="text-4xl font-serif font-bold text-white mb-1">
              {data?.estateCount || 0}
            </div>
            <p className="text-neutral-400 text-sm mb-6">
              Active administration cases
            </p>

            <div className="flex items-center justify-between border-t border-white/10 pt-4">
              <span className="text-xs font-medium text-[#C8A165]">
                <Activity className="inline h-3 w-3 mr-1" />
                Solvency Checks Active
              </span>
              <ArrowRight className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1" />
            </div>
          </CardContent>
        </Card>

        {/* CARD 2: MY WILLS (The Legacy) */}
        <Card 
          onClick={() => navigate('/dashboard/wills')}
          className="group relative overflow-hidden border-2 border-transparent bg-white cursor-pointer transition-all hover:border-[#C8A165] hover:shadow-xl hover:-translate-y-1"
        >
           {/* Background Pattern */}
           <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 translate-y-[-8px] opacity-5 text-[#C8A165]">
            <ScrollText className="h-full w-full" />
          </div>

          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-neutral-500 text-sm uppercase tracking-wider font-medium">
              <ScrollText className="h-4 w-4 text-[#C8A165]" /> Legacy Plans
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            <div className="text-4xl font-serif font-bold text-[#0F3D3E] mb-1">
              {data?.willCount || 0}
            </div>
            <p className="text-neutral-500 text-sm mb-6">
              Wills & Trusts drafted
            </p>

            <div className="flex items-center justify-between border-t border-neutral-100 pt-4">
              <span className="text-xs font-medium text-neutral-400 group-hover:text-[#C8A165] transition-colors">
                View Documents
              </span>
              <ArrowRight className="h-4 w-4 text-[#0F3D3E] opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1" />
            </div>
          </CardContent>
        </Card>

        {/* CARD 3: SYSTEM ALERTS (The Copilot) */}
        <Card className="border-neutral-200 bg-[#F8F9FA]">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-neutral-500 text-sm uppercase tracking-wider font-medium">
              <TrendingUp className="h-4 w-4 text-blue-600" /> Copilot Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Alert Item 1 */}
              <div className="flex gap-3 items-start">
                <div className="mt-0.5 rounded-full bg-amber-100 p-1">
                  <AlertTriangle className="h-3 w-3 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#0F3D3E]">Verify Assets</p>
                  <p className="text-xs text-neutral-500">2 Title Deeds pending OCR verification.</p>
                </div>
              </div>
              
              {/* Alert Item 2 */}
              <div className="flex gap-3 items-start">
                <div className="mt-0.5 rounded-full bg-blue-100 p-1">
                  <Activity className="h-3 w-3 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#0F3D3E]">Market Update</p>
                  <p className="text-xs text-neutral-500">Land values in Nairobi up 2.4%.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};