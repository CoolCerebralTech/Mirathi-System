// src/pages/FamilyTreePage.tsx
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
  Loader2
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
  const [, setShowGuardianship] = useState(false);

  // Check for URL parameters
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
    // TODO: Implement PDF export
    console.log('Export family tree as PDF');
    // This would trigger a PDF generation API call
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${tree?.name || 'Family'} Tree`,
        text: 'View my family tree on Mirathi',
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      // Show toast notification
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Error states
  if (myFamilyError || treeError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Failed to Load Family Tree</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>{myFamilyError?.message || treeError?.message}</p>
            <div className="flex gap-2 mt-2">
              <Button variant="outline" onClick={() => refetch()}>
                Retry
              </Button>
              <Button onClick={() => navigate('/dashboard')}>
                Go to Dashboard
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // No family found
  if (!effectiveFamilyId && !loadingMyFamily) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Family Found</AlertTitle>
          <AlertDescription className="space-y-4">
            <p>You haven't created a family tree yet.</p>
            <Button onClick={() => navigate('/dashboard')}>
              Create Family Tree
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Loading state
  if (loadingMyFamily || loadingTree) {
    return (
      <div className="flex flex-col h-screen bg-slate-50">
        <div className="border-b bg-white">
          <div className="container mx-auto px-6 py-4">
            <Skeleton className="h-8 w-48" />
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          <div className="container mx-auto p-6">
            <Card className="min-h-[calc(100vh-200px)]">
              <CardContent className="p-8 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Header */}
      <div className="border-b bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/dashboard')}
                className="shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-xl font-bold truncate">
                  {tree?.name || 'Family Tree'}
                </h1>
                <p className="text-sm text-muted-foreground truncate">
                  {tree?.stats?.totalMembers || 0} members • {tree?.stats?.isPolygamous ? 'Polygamous' : 'Monogamous'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="shrink-0"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="shrink-0"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleFullscreen}
                className="shrink-0"
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4 mr-2" />
                ) : (
                  <Maximize2 className="h-4 w-4 mr-2" />
                )}
                {isFullscreen ? 'Exit' : 'Fullscreen'}
              </Button>
              <Button 
                onClick={() => setIsAddMemberOpen(true)}
                size="sm"
                className="shrink-0"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tree Canvas */}
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto p-4">
          <Card className="min-h-[calc(100vh-180px)]">
            <CardContent className="p-4 md:p-8">
              {tree ? (
                <FamilyTreeViz
                  onNodeClick={setSelectedMemberId}
                  onAddClick={() => setIsAddMemberOpen(true)}
                />
              ) : (
                <div className="flex items-center justify-center h-96">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No Family Data</AlertTitle>
                    <AlertDescription>
                      Unable to load family tree. Please try again.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
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
          setSelectedMemberId(null);
          setShowGuardianship(true);
          // Could navigate to guardianship page or open modal
          navigate(`/family/guardianship?wardId=${memberId}`);
        }}
      />
    </div>
  );
};