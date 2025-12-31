import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  History, 
  FileText, 
  Loader2, 
  BookOpen,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui';
import { EmptyState } from '@/components/common';
import { CreateDraftWillDialog } from '@/features/will/dialogs';
import { WillSummaryCard } from '@/features/will/components';
import { useActiveWill, useWillHistory } from '@/features/will/will.api';
import type { WillSummaryResponse, WillDetailResponse } from '@/types/will.types';



export const WillDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('current');

  // Fetch Data
  const { data: activeWill, isLoading: loadingActive } = useActiveWill();
  const { data: history, isLoading: loadingHistory } = useWillHistory();

  const isLoading = loadingActive || loadingHistory;

  // Helper to adapt Detail response to Summary card props if needed
  const mapDetailToSummary = (detail: WillDetailResponse): WillSummaryResponse => ({
    id: detail.id,
    testatorId: detail.testatorId,
    status: detail.status,
    type: detail.type,
    createdAt: detail.createdAt,
    isRevoked: detail.isRevoked,
    hasCodicils: detail.codicils?.length > 0,
    hasDisinheritance: detail.disinheritanceRecords?.length > 0,
    executionDate: detail.executionDate,
    isValid: detail.isValid,
    validationErrorsCount: detail.validationErrors?.length || 0
  });

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-sm text-slate-500">Loading your estate plan...</p>
        </div>
      </div>
    );
  }

  // Scenario 1: No Wills at all (New User)
  if (!activeWill && (!history || history.length === 0)) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-4xl mx-auto space-y-8">
           <div className="space-y-2">
              <h1 className="text-3xl font-bold text-slate-900">Estate Planning</h1>
              <p className="text-slate-500">Protect your legacy and your loved ones.</p>
           </div>
           
           <EmptyState
             icon={FileText}
             title="No Will Found"
             description="You haven't created a Will yet. Under Kenyan law, dying without a Will (Intestacy) can lead to lengthy court delays and family disputes."
             // FIX: Passing strict object instead of JSX
             action={{
               label: "Start My Will",
               onClick: () => setShowCreateDialog(true)
             }}
           />

           {/* Educational Cards */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                 <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center mb-3 text-blue-600">
                    <BookOpen className="h-4 w-4" />
                 </div>
                 <h3 className="font-semibold text-slate-900 mb-1">Avoid Intestacy</h3>
                 <p className="text-sm text-slate-500">Learn how the government distributes assets if you don't have a plan.</p>
              </div>
           </div>
        </div>
        <CreateDraftWillDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header Area */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
               <h1 className="text-2xl font-bold text-slate-900">My Wills</h1>
               <p className="text-sm text-slate-500">Manage your testament and revisions</p>
            </div>
            {!activeWill && (
               <Button onClick={() => setShowCreateDialog(true)} className="gap-2 bg-indigo-600">
                 <Plus className="h-4 w-4" /> Create New Will
               </Button>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white border">
            <TabsTrigger value="current" className="gap-2 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
              <FileText className="h-4 w-4" />
              Current Will
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="h-4 w-4" />
              History & Revocations
            </TabsTrigger>
          </TabsList>

          {/* --- TAB: CURRENT WILL --- */}
          <TabsContent value="current" className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            {activeWill ? (
              <>
                <WillSummaryCard 
                  will={mapDetailToSummary(activeWill)} 
                  onViewDetails={(id) => navigate(`/dashboard/will/${id}/edit`)}
                />

                {/* Status-based Call to Action */}
                {activeWill.status === 'DRAFT' && (
                   <Alert className="bg-blue-50 border-blue-200">
                      <AlertTitle className="text-blue-800 font-semibold">Finish your draft</AlertTitle>
                      <AlertDescription className="text-blue-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                         <span>
                           Your will is not yet legally binding. You need to complete the sections and perform the Execution Ceremony.
                         </span>
                         <Button size="sm" variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100" onClick={() => navigate(`/dashboard/will/${activeWill.id}/edit`)}>
                           Continue Drafting <ArrowRight className="ml-2 h-3 w-3" />
                         </Button>
                      </AlertDescription>
                   </Alert>
                )}
              </>
            ) : (
              <EmptyState
                icon={FileText}
                title="No Active Will"
                description="You do not have a currently active or drafted Will."
                // FIX: Passing strict object instead of JSX
                action={{
                  label: "Create One Now",
                  onClick: () => setShowCreateDialog(true)
                }}
              />
            )}
          </TabsContent>

          {/* --- TAB: HISTORY --- */}
          <TabsContent value="history" className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
             {!history || history.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                   <History className="h-10 w-10 mx-auto mb-3 opacity-20" />
                   <p>No historical records found.</p>
                </div>
             ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {history.map(will => (
                      <WillSummaryCard 
                        key={will.id} 
                        will={will}
                        onViewDetails={(id) => navigate(`/dashboard/will/${id}/edit`)} 
                      />
                   ))}
                </div>
             )}
          </TabsContent>
        </Tabs>
      </div>

      <CreateDraftWillDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />
    </div>
  );
};