// ============================================================================
// FILE 1: src/pages/family/FamilyTreePage.tsx
// Dedicated full-screen family tree visualization
// ============================================================================

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Maximize2, Download, Share2 } from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
} from '@/components/ui';
import {
  FamilyTreeViz,
  AddMemberDialog,
  MemberDetailSheet,
} from '@/features/family/components';
import { useFamilyTree, useMyFamily } from '@/features/family/family.api';

export const FamilyTreePage: React.FC = () => {
  const { familyId } = useParams<{ familyId?: string }>();
  const navigate = useNavigate();
  
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [, setIsFullscreen] = useState(false);

  // Use specific family ID or fallback to user's family
  const { data: myFamily } = useMyFamily();
  const effectiveFamilyId = familyId || myFamily?.id || '';
  
  const { data: tree, isLoading } = useFamilyTree(effectiveFamilyId, {
    enabled: !!effectiveFamilyId
  });

  const handleExport = () => {
    // TODO: Implement PDF export
    console.log('Export family tree as PDF');
  };

  const handleShare = () => {
    // TODO: Implement share functionality
    console.log('Share family tree');
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

  if (!effectiveFamilyId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">No family found</p>
          <Button onClick={() => navigate('/dashboard/family')}>
            Go to Family Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/dashboard/family')}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Family Tree</h1>
                <p className="text-sm text-muted-foreground">
                  {tree?.name || 'Visual family structure'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleFullscreen}
              >
                <Maximize2 className="h-4 w-4 mr-2" />
                Fullscreen
              </Button>
              <Button onClick={() => setIsAddMemberOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tree Canvas */}
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto p-6">
          <Card className="min-h-[calc(100vh-200px)]">
            <CardContent className="p-8">
              {isLoading ? (
                <div className="flex items-center justify-center h-96">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
                </div>
              ) : (
                <FamilyTreeViz
                  onNodeClick={setSelectedMemberId}
                  onAddClick={() => setIsAddMemberOpen(true)}
                />
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
        onOpenGuardianship={() => {}}
      />
    </div>
  );
};