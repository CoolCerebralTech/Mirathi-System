// FILE: src/pages/family/FamilyTreePage.tsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Plus, 
  Maximize2, 
  Minimize2,
  Download, 
  Share2,
  AlertCircle,
  Loader2,
  TreePine
} from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  Alert,
  AlertDescription,
  AlertTitle,
  Skeleton,
} from '@/components/ui';

import {
  FamilyTreeViz,
  AddMemberDialog,
  MemberDetailSheet,
} from '@/features/family/components';

import { 
  useFamilyTree, 
  useMyFamily 
} from '@/api/family/family.api';

export const FamilyTreePage: React.FC = () => {
  const { familyId } = useParams<{ familyId?: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Check for URL parameters (e.g., ?action=add)
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'add') {
      setIsAddMemberOpen(true);
    }
  }, [searchParams]);

  // Use specific family ID or fallback to user's family
  const { 
    data: myFamily, 
    isLoading: loadingMyFamily,
    error: myFamilyError 
  } = useMyFamily();
  
  const effectiveFamilyId = familyId || myFamily?.id || '';
  
  const { 
    data: tree, 
    isLoading: loadingTree,
    error: treeError,
    refetch 
  } = useFamilyTree(effectiveFamilyId, {
    enabled: !!effectiveFamilyId
  });

  const handleExport = () => {
    // TODO: Implement PDF export API integration
    console.log('Export family tree as PDF');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${tree?.name || 'Family'} Tree - Mirathi`,
        text: 'View my digital succession plan on Mirathi',
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      // Ideally show a toast here
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(console.error);
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(console.error);
      setIsFullscreen(false);
    }
  };

  // Handle fullscreen change events from browser (e.g. Esc key)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // 1. Error states
  if (myFamilyError || treeError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-slate-50">
        <Alert variant="destructive" className="max-w-md bg-white shadow-sm">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Failed to Load Family Tree</AlertTitle>
          <AlertDescription className="space-y-4 pt-2">
            <p className="text-sm">{myFamilyError?.message || treeError?.message || 'An unexpected error occurred.'}</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => refetch()} size="sm">
                Retry
              </Button>
              <Button onClick={() => navigate('/dashboard')} size="sm">
                Return to Dashboard
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // 2. No family found (User hasn't created one yet)
  if (!effectiveFamilyId && !loadingMyFamily) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-slate-50">
        <div className="text-center max-w-md space-y-6">
          <div className="h-20 w-20 bg-white rounded-full flex items-center justify-center shadow-sm mx-auto">
            <TreePine className="h-10 w-10 text-slate-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">No Family Tree Found</h2>
          <p className="text-slate-600">
            You haven't set up your family structure yet. Start by creating a tree to manage your succession plan.
          </p>
          <Button onClick={() => navigate('/dashboard')} size="lg">
            Create Family Tree
          </Button>
        </div>
      </div>
    );
  }

  // 3. Loading state
  if (loadingMyFamily || loadingTree) {
    return (
      <div className="flex flex-col h-screen bg-slate-50">
        <div className="border-b bg-white">
          <div className="container mx-auto px-6 py-4 flex items-center gap-4">
             <Skeleton className="h-10 w-10 rounded-md" />
             <div className="space-y-2">
               <Skeleton className="h-5 w-48" />
               <Skeleton className="h-3 w-32" />
             </div>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-6">
          <div className="container mx-auto h-full">
            <Card className="h-full border-dashed shadow-none bg-slate-50/50">
              <CardContent className="h-full flex flex-col items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary/30 mb-4" />
                <p className="text-sm text-slate-500 font-medium animate-pulse">Mapping family structure...</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // 4. Main Render
  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      {/* Header Bar */}
      <div className="border-b bg-white shadow-sm z-20 relative">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            
            {/* Left: Navigation & Title */}
            <div className="flex items-center gap-3 overflow-hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/dashboard/family')}
                className="shrink-0 text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                title="Back to Dashboard"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-slate-900 truncate flex items-center gap-2">
                  <TreePine className="h-4 w-4 text-primary" />
                  {tree?.name || 'Family Tree'}
                </h1>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>{tree?.stats?.totalMembers || 0} Members</span>
                  <span>•</span>
                  <span>{tree?.stats?.isPolygamous ? 'Polygamous' : 'Monogamous'}</span>
                </div>
              </div>
            </div>

            {/* Right: Actions Toolbar */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="shrink-0 text-slate-600"
              >
                <Share2 className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Share</span>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExport}
                className="shrink-0 text-slate-600"
              >
                <Download className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Export</span>
              </Button>
              
              <div className="h-4 w-[1px] bg-slate-200 mx-1 hidden sm:block" />

              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFullscreen}
                className="shrink-0 text-slate-600"
                title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>

              <Button 
                onClick={() => setIsAddMemberOpen(true)}
                size="sm"
                className="shrink-0 bg-primary hover:bg-primary/90 text-white shadow-sm"
              >
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Add Member</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tree Visualization Canvas */}
      <div className="flex-1 overflow-auto bg-slate-50/50 relative">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]" 
             style={{ 
               backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', 
               backgroundSize: '20px 20px' 
             }} 
        />
        
        <div className="container mx-auto p-4 min-h-full flex flex-col">
          <Card className="flex-1 border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <CardContent className="flex-1 p-0 overflow-auto relative">
              {tree ? (
                <div className="min-w-full min-h-full p-8 flex items-center justify-center">
                  <FamilyTreeViz
                    onNodeClick={setSelectedMemberId}
                    onAddClick={() => setIsAddMemberOpen(true)}
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8">
                  <AlertCircle className="h-12 w-12 mb-4 opacity-50" />
                  <p>Unable to render tree visualization.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals & Sheets */}
      <AddMemberDialog
        isOpen={isAddMemberOpen}
        onClose={() => setIsAddMemberOpen(false)}
        familyId={effectiveFamilyId}
      />

      <MemberDetailSheet
        memberId={selectedMemberId}
        familyId={effectiveFamilyId}
        onClose={() => setSelectedMemberId(null)}
        onOpenGuardianship={(memberId) => {
          // Close sheet and navigate to guardianship management
          setSelectedMemberId(null);
          navigate(`/dashboard/family/guardianships?wardId=${memberId}`);
        }}
        onEdit={(memberId) => {
          // Future implementation: Open edit dialog
          console.log('Edit member:', memberId);
          // For now, we can perhaps show a toast or implement a separate Edit Dialog
        }}
      />
    </div>
  );
};