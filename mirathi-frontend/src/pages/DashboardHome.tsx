// FILE: src/pages/DashboardHome.tsx

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Building2, ScrollText, Plus } from 'lucide-react';

import { apiClient } from '@/api/client';
import { PageHeader, LoadingSpinner } from '@/components/common';
import { Button, Card, CardHeader, CardTitle, CardContent } from '@/components/ui';

// Simple types for the check
interface UserStats {
  estateCount: number;
  willCount: number;
}

export const DashboardHome: React.FC = () => {
  const navigate = useNavigate();

  // 1. Check User Data
  const { data, isLoading, isError } = useQuery({
    queryKey: ['user-stats'],
    queryFn: async () => {
      // If this endpoint doesn't exist on backend yet, it throws error -> isError = true
      const res = await apiClient.get<UserStats>('/account/stats'); 
      return res.data;
    },
    retry: 1, // Don't retry too many times if it fails
  });

  // 2. The "Golden Entry" Logic
  useEffect(() => {
    if (!isLoading) {
      // SCENARIO A: API Success, counts are 0 -> New User
      if (data && data.estateCount === 0 && data.willCount === 0) {
        navigate('/onboarding', { replace: true });
      }
      
      // SCENARIO B: API Failed (New System) -> Assume New User
      if (isError) {
        // If we can't verify stats, safer to send them to onboarding to start fresh
        navigate('/onboarding', { replace: true });
      }
    }
  }, [data, isLoading, isError, navigate]);

  // 3. Loading State (Prevent Flash)
  if (isLoading || (!data && !isError)) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <LoadingSpinner text="Checking account status..." />
      </div>
    );
  }

  // 4. Return NULL if we are about to redirect (Prevent Flash)
  if ((data && data.estateCount === 0 && data.willCount === 0) || isError) {
    return null; 
  }

  // 5. The "Portfolio View" (ONLY renders if user actually has data)
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader 
            title="My Portfolio" 
            description="Overview of your managed estates and plans." 
        />
        <Button onClick={() => navigate('/estates/new')}>
            <Plus className="mr-2 h-4 w-4" /> New Estate
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Estates Summary Card */}
        <Card className="hover:shadow-md transition-all cursor-pointer" onClick={() => navigate('/dashboard/estates')}>
            <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center justify-between">
                    <span className="flex items-center gap-2"><Building2 className="h-5 w-5 text-blue-600"/> Estates Managed</span>
                    <span className="text-2xl font-bold">{data?.estateCount || 0}</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground mb-4">Manage assets, liabilities, and distribution.</p>
                <Button variant="outline" size="sm" className="w-full">View Estates</Button>
            </CardContent>
        </Card>

        {/* Wills Summary Card */}
        <Card className="hover:shadow-md transition-all cursor-pointer" onClick={() => navigate('/dashboard/wills')}>
            <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center justify-between">
                    <span className="flex items-center gap-2"><ScrollText className="h-5 w-5 text-amber-600"/> My Wills</span>
                    <span className="text-2xl font-bold">{data?.willCount || 0}</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground mb-4">Update your legacy plan and instructions.</p>
                <Button variant="outline" size="sm" className="w-full">View Wills</Button>
            </CardContent>
        </Card>
      </div>
    </div>
  );
};