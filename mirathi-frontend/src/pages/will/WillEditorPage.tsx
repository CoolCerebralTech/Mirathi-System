import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Loader2, 
  ArrowLeft, 
  AlertTriangle, 
  CheckCircle2 
} from 'lucide-react';
import { Button } from '@/components/ui';
import { useWillDetail } from '@/features/will/will.api';
import { WillStatus } from '@/types/will.types';

// Components
import { WillHeader } from '@/features/will/components';
import { EditorTabs, type EditorTabValue } from '@/features/will/components';
import { EditorSidebar } from '@/features/will/components';
import { AutoSaveIndicator } from '@/features/will/components';
import { ProgressTracker } from '@/features/will/components';
import { ValidationAlert } from '@/features//will/components';

// Tab Views
import { ExecutorList } from '@/features/will/components';
import { BeneficiaryList } from '@/features/will/components';
import { WitnessList } from '@/features/will/components';
import { CapacityCard } from '@/features/will/components';
import { DisinheritanceList } from '@/features/will/components';
import { CodicilTimeline } from '@/features/will/components';

// Dialogs
import { AppointExecutorDialog } from '@/features/will/dialogs';
import { AddBeneficiaryDialog } from '@/features/will/dialogs';
import { AddWitnessDialog } from '@/features/will/dialogs';
import { UpdateCapacityDialog } from '@/features/will/dialogs';
import { RecordDisinheritanceDialog } from '@/features/will/dialogs';
import { AddCodicilDialog } from '@/features/will/dialogs';

export const WillEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<EditorTabValue>('basics');
  
  // Dialog States
  const [showExecutorDialog, setShowExecutorDialog] = useState(false);
  const [showBeneficiaryDialog, setShowBeneficiaryDialog] = useState(false);
  const [showWitnessDialog, setShowWitnessDialog] = useState(false);
  const [showCapacityDialog, setShowCapacityDialog] = useState(false);
  const [showDisinheritanceDialog, setShowDisinheritanceDialog] = useState(false);
  const [showCodicilDialog, setShowCodicilDialog] = useState(false);

  // Data Fetching
  const { data: will, isLoading, isError } = useWillDetail(id!);

  // Navigation Guard
  useEffect(() => {
    if (will && will.status !== WillStatus.DRAFT && will.status !== WillStatus.PENDING_EXECUTION) {
      // If will is already active or revoked, redirect to summary/dashboard
      // navigate(`/dashboard/will/${id}`);
    }
  }, [will, id, navigate]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-sm text-slate-500">Loading your secure workspace...</p>
        </div>
      </div>
    );
  }

  if (isError || !will) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-slate-50">
        <AlertTriangle className="h-12 w-12 text-red-500" />
        <h2 className="text-xl font-bold text-slate-900">Unable to load Will</h2>
        <Button variant="outline" onClick={() => navigate('/dashboard/wills')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Return to Dashboard
        </Button>
      </div>
    );
  }

  // Calculate Progress (Simple heuristic for demo)
  const calculateProgress = () => {
    let score = 0;
    if (will.capacityDeclaration) score += 20;
    if (will.executors.length > 0) score += 20;
    if (will.bequests.length > 0) score += 20;
    if (will.witnesses.length >= 2) score += 20;
    if (will.validationErrors.length === 0) score += 20;
    return score;
  };

  const progress = calculateProgress();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* 1. Editor Header */}
      <div className="sticky top-0 z-20 bg-white shadow-sm border-b">
        <div className="container mx-auto px-4">
          <WillHeader
            title="Drafting Workspace"
            status={will.status}
            type={will.type}
            showBack={true}
            lastUpdated={will.updatedAt}
            className="border-b-0 pb-4 pt-4"
            actions={
              <div className="flex items-center gap-4">
                <AutoSaveIndicator status="saved" lastSavedAt={new Date(will.updatedAt)} />
                <div className="h-8 w-px bg-slate-200" />
                <Button 
                  onClick={() => navigate(`/wills/${id}/execute`)}
                  disabled={progress < 100 || will.validationErrors.length > 0}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                   Execute Will
                </Button>
              </div>
            }
          />
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* 2. Main Editing Area (Left Column) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Validation Banner */}
            {will.validationErrors.length > 0 && (
              <ValidationAlert errors={will.validationErrors} />
            )}

            {/* Editor Container */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[600px] flex flex-col">
              <EditorTabs 
                activeTab={activeTab} 
                onTabChange={(v) => setActiveTab(v as EditorTabValue)}
              >
                
                {/* --- TAB: BASICS --- */}
                {activeTab === 'basics' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="space-y-2">
                      <h2 className="text-xl font-bold text-slate-900">Basics & Capacity</h2>
                      <p className="text-sm text-slate-500">
                        Establish the legal foundation. Under S.5 of the Law of Succession Act, you must prove you are of sound mind.
                      </p>
                    </div>

                    <CapacityCard 
                      data={will.capacityDeclaration} 
                      onUpdate={() => setShowCapacityDialog(true)}
                    />

                    <div className="pt-4 border-t">
                       <div className="flex items-center justify-between mb-4">
                          <div className="space-y-1">
                             <h3 className="font-semibold text-slate-900">Amendments (Codicils)</h3>
                             <p className="text-xs text-muted-foreground">History of changes made to this draft.</p>
                          </div>
                       </div>
                       <CodicilTimeline 
                         codicils={will.codicils} 
                         onView={(cid) => console.log('View Codicil', cid)}
                         onAdd={() => setShowCodicilDialog(true)}
                       />
                    </div>
                  </div>
                )}

                {/* --- TAB: EXECUTORS --- */}
                {activeTab === 'executors' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="space-y-2">
                      <h2 className="text-xl font-bold text-slate-900">Executors</h2>
                      <p className="text-sm text-slate-500">
                        Appoint the people who will administer your estate (S.6 LSA). You can have up to 4 executors.
                      </p>
                    </div>
                    
                    <ExecutorList 
                      executors={will.executors}
                      onAdd={() => setShowExecutorDialog(true)}
                      onEdit={(eid) => console.log('Edit Executor', eid)}
                      onDelete={(eid) => console.log('Delete Executor', eid)}
                    />
                  </div>
                )}

                {/* --- TAB: BENEFICIARIES --- */}
                {activeTab === 'beneficiaries' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="space-y-2">
                      <h2 className="text-xl font-bold text-slate-900">Beneficiaries</h2>
                      <p className="text-sm text-slate-500">
                        Who gets what? Ensure you clearly define your gifts.
                      </p>
                    </div>
                    
                    <BeneficiaryList 
                      bequests={will.bequests}
                      onAdd={() => setShowBeneficiaryDialog(true)}
                      onEdit={(bid) => console.log('Edit Bequest', bid)}
                      onDelete={(bid) => console.log('Delete Bequest', bid)}
                    />

                    <div className="mt-8 pt-6 border-t space-y-4">
                       <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                          Disinheritance & Exclusions
                       </h3>
                       <DisinheritanceList 
                          records={will.disinheritanceRecords}
                          onAdd={() => setShowDisinheritanceDialog(true)}
                       />
                    </div>
                  </div>
                )}

                 {/* --- TAB: ASSETS (Placeholder) --- */}
                 {activeTab === 'assets' && (
                  <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in">
                      <div className="bg-slate-100 p-4 rounded-full mb-4">
                         <CheckCircle2 className="h-8 w-8 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900">Asset Integration</h3>
                      <p className="text-slate-500 max-w-sm mt-2">
                        To link specific assets (Title Deeds, Logbooks) to this Will, please go to the <strong>Estate Service</strong> module to verify your inventory first.
                      </p>
                      <Button variant="outline" className="mt-6">
                        Go to Estate Inventory
                      </Button>
                  </div>
                )}

                {/* --- TAB: WITNESSES --- */}
                {activeTab === 'witnesses' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="space-y-2">
                      <h2 className="text-xl font-bold text-slate-900">Witnesses</h2>
                      <p className="text-sm text-slate-500">
                        Nominate at least 2 competent witnesses. They must NOT be beneficiaries (S.13 LSA).
                      </p>
                    </div>
                    
                    <WitnessList 
                      witnesses={will.witnesses}
                      onAdd={() => setShowWitnessDialog(true)}
                      onEdit={(wid) => console.log('Edit Witness', wid)}
                      onDelete={(wid) => console.log('Delete Witness', wid)}
                    />
                  </div>
                )}

                {/* --- TAB: REVIEW --- */}
                {activeTab === 'review' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="space-y-2">
                      <h2 className="text-xl font-bold text-slate-900">Legal Review</h2>
                      <p className="text-sm text-slate-500">
                        Final checks before execution.
                      </p>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 text-center">
                        <p className="text-slate-600 mb-4">
                           Your Will is currently <strong>{progress}% complete</strong>. 
                           {progress < 100 && " Complete the remaining sections to enable execution."}
                        </p>
                        {progress === 100 ? (
                           <Button className="w-full bg-emerald-600 hover:bg-emerald-700" size="lg" onClick={() => navigate(`/wills/${id}/execute`)}>
                              Proceed to Signing Ceremony
                           </Button>
                        ) : (
                           <Button disabled variant="secondary">
                             Resolve Issues to Execute
                           </Button>
                        )}
                    </div>
                  </div>
                )}

              </EditorTabs>
            </div>
          </div>

          {/* 3. Sidebar (Right Column) */}
          <div className="lg:col-span-4 space-y-6">
            <ProgressTracker percentage={progress} currentStepLabel="Readiness" />
            
            {/* Contextual Help */}
            <div className="sticky top-24">
              <EditorSidebar activeSection={activeTab} />
            </div>
          </div>
        </div>
      </div>

      {/* 4. Dialogs Layer */}
      {id && (
        <>
          <AppointExecutorDialog 
            willId={id} 
            open={showExecutorDialog} 
            onOpenChange={setShowExecutorDialog} 
            existingExecutorsCount={will.executors.length}
          />
          <AddBeneficiaryDialog 
            willId={id} 
            open={showBeneficiaryDialog} 
            onOpenChange={setShowBeneficiaryDialog} 
          />
          <AddWitnessDialog 
            willId={id} 
            open={showWitnessDialog} 
            onOpenChange={setShowWitnessDialog} 
          />
          <UpdateCapacityDialog 
            willId={id} 
            open={showCapacityDialog} 
            onOpenChange={setShowCapacityDialog} 
          />
          <RecordDisinheritanceDialog 
            willId={id} 
            open={showDisinheritanceDialog} 
            onOpenChange={setShowDisinheritanceDialog} 
          />
          <AddCodicilDialog 
            willId={id} 
            open={showCodicilDialog} 
            onOpenChange={setShowCodicilDialog} 
          />
        </>
      )}
    </div>
  );
};