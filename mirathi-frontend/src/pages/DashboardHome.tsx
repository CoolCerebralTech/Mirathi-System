import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Building2, ScrollText } from 'lucide-react';

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
      // Endpoint to check what the user owns
      // If this endpoint doesn't exist yet, we can mock it or use the estate list
      const res = await apiClient.get<UserStats>('/account/stats'); 
      return res.data;
    },
    retry: false
  });

  // 2. The "Golden Entry" Logic
  useEffect(() => {
    if (!isLoading && data) {
      // If user has NOTHING, send them to Onboarding
      if (data.estateCount === 0 && data.willCount === 0) {
        navigate('/onboarding', { replace: true });
      }
    }
  }, [data, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <LoadingSpinner text="Checking account status..." />
      </div>
    );
  }

  // 3. Fallback / Error State (Safeguard against blank screen)
  if (isError) {
    // If API fails, default to showing the empty state options
    return (
        <div className="p-6 space-y-6">
            <PageHeader title="Welcome to Mirathi" description="Get started by selecting a service." />
            <div className="grid gap-6 md:grid-cols-2">
                <Card className="cursor-pointer hover:border-primary/50" onClick={() => navigate('/dashboard/estates/new')}>
                    <CardHeader><CardTitle className="flex items-center gap-2"><Building2 /> Create Estate</CardTitle></CardHeader>
                    <CardContent>Manage assets and debts for a deceased person.</CardContent>
                </Card>
                <Card className="cursor-pointer hover:border-primary/50" onClick={() => navigate('/dashboard/wills/new')}>
                    <CardHeader><CardTitle className="flex items-center gap-2"><ScrollText /> Write Will</CardTitle></CardHeader>
                    <CardContent>Plan your own legacy and asset distribution.</CardContent>
                </Card>
            </div>
        </div>
    );
  }

  // 4. The "Portfolio View" (For users who already have data)
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader 
            title="My Portfolio" 
            description="Overview of your managed estates and plans." 
        />
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