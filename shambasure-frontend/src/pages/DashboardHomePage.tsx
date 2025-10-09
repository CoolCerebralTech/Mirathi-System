// FILE: src/pages/DashboardHomePage.tsx

import { PageHeader } from '../components/common/PageHeader';
import { StatCard } from '../components/common/StatCard';
import { useMyAssets } from '../features/assets/assets.api'; // Assuming you have stats hooks
import { useMyDocuments } from '../features/documents/documents.api'; // Or dedicated stats hooks
import { Landmark, FileText, CheckCircle, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '../store/auth.store';

export function DashboardHomePage() {
  const user = useAuthStore((state) => state.user);
  
  // In a real app, you would have dedicated API hooks for fetching stats,
  // like `useAssetStats()` and `useDocumentStats()`.
  // For now, we'll simulate the data by getting the length of the lists.
  const { data: assets, isLoading: assetsLoading } = useMyAssets();
  const { data: documents, isLoading: documentsLoading } = useMyDocuments();

  const totalAssets = assets?.length || 0;
  const totalDocuments = documents?.data.length || 0;
  
  // Example of calculating stats from the documents list
  const verifiedDocuments = documents?.data.filter(d => d.status === 'VERIFIED').length || 0;
  const pendingDocuments = documents?.data.filter(d => d.status === 'PENDING_VERIFICATION').length || 0;


  const isLoading = assetsLoading || documentsLoading;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${user?.firstName || 'User'}!`}
        description="Here's a quick overview of your estate."
      />
      
      {/* Grid for the stat cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Assets"
          value={isLoading ? '...' : totalAssets}
          icon={Landmark}
          description="All registered land, vehicles, etc."
        />
        <StatCard 
          title="Total Documents"
          value={isLoading ? '...' : totalDocuments}
          icon={FileText}
          description="All uploaded title deeds, IDs, etc."
        />
        <StatCard 
          title="Verified Documents"
          value={isLoading ? '...' : verifiedDocuments}
          icon={CheckCircle}
          description="Documents confirmed by administration."
        />
        <StatCard 
          title="Pending Verification"
          value={isLoading ? '...' : pendingDocuments}
          icon={AlertTriangle}
          description="Documents awaiting review."
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Placeholder for a list of recent activity */}
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <h3 className="font-semibold mb-4">Recent Activity</h3>
            <p className="text-sm text-muted-foreground">Recent activity feed will be displayed here.</p>
        </div>
        {/* Placeholder for a summary of the active will */}
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <h3 className="font-semibold mb-4">Active Will Summary</h3>
            <p className="text-sm text-muted-foreground">A summary of the currently active will be displayed here.</p>
        </div>
      </div>
    </div>
  );
}