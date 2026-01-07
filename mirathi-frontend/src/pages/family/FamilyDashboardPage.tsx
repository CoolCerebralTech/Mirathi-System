// FILE: src/pages/family/FamilyDashboardPage.tsx

import React, { useState, useEffect } from 'react';
import { Plus, Users, AlertCircle, Loader2 } from 'lucide-react';
import { 
  Button, 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  Alert,
  AlertDescription,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
} from '@/components/ui';
import { PageHeader } from '@/components/common';
import { 
  FamilyTreeViz,
  AddMemberDialog,
  CreateFamilyDialog,
  MemberDetailSheet,
  HeirsOverview,
  GuardianshipManager,
  SmartSuggestions,
} from '@/features/family/components';
import { useMyFamily, useMyFamilyTree } from '@/features/family/family.api';
import type { SmartSuggestion } from '@/types/family.types';

export const FamilyDashboardPage: React.FC = () => {
  // State Management
  const [isCreateFamilyOpen, setIsCreateFamilyOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [guardianshipWardId, setGuardianshipWardId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([]);

  // Data Fetching
  const { data: family, isLoading: loadingFamily, isError: familyError } = useMyFamily();
  const { data: tree, isLoading: loadingTree } = useMyFamilyTree();

  // Auto-open create dialog if no family exists
  useEffect(() => {
    if (!loadingFamily && !family && !familyError) {
      setIsCreateFamilyOpen(true);
    }
  }, [loadingFamily, family, familyError]);

  // Handlers
  const handleNodeClick = (id: string) => {
    setSelectedMemberId(id);
  };
  
  const handleOpenGuardianship = (id: string) => {
    setSelectedMemberId(null);
    setGuardianshipWardId(id);
  };

  const handleSuggestionAction = (suggestion: SmartSuggestion) => {
    // Handle different suggestion actions
    switch (suggestion.code) {
      case 'ADD_SPOUSE':
      case 'ADD_CHILDREN':
      case 'ADD_PARENTS':
        setIsAddMemberOpen(true);
        break;
      case 'ASSIGN_GUARDIAN':
        if (suggestion.contextId) {
          setGuardianshipWardId(suggestion.contextId);
        }
        break;
      default:
        console.log('Unhandled suggestion:', suggestion);
    }
  };

  const handleDismissSuggestion = (index: number) => {
    setSuggestions(prev => prev.filter((_, i) => i !== index));
  };

  // Loading State
  if (loadingFamily) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading your family tree...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (familyError) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load family data. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // No Family State
  if (!family) {
    return (
      <>
        <div className="flex h-screen items-center justify-center bg-slate-50">
          <div className="text-center space-y-6 max-w-md p-8">
            <div className="mx-auto h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="h-10 w-10 text-primary" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Welcome to Family Planning</h1>
              <p className="text-muted-foreground">
                Create your family tree to begin your succession planning journey.
                Add family members, identify heirs, and manage guardianship.
              </p>
            </div>
            <Button size="lg" onClick={() => setIsCreateFamilyOpen(true)}>
              <Plus className="mr-2 h-5 w-5" />
              Create Family Tree
            </Button>
          </div>
        </div>

        <CreateFamilyDialog
          isOpen={isCreateFamilyOpen}
          onClose={() => setIsCreateFamilyOpen(false)}
        />
      </>
    );
  }

  // Calculate some stats for the header
  const stats = tree?.stats || {
    totalMembers: 0,
    totalMinors: 0,
    totalSpouses: 0,
    isPolygamous: false,
    completenessScore: 0,
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50">
      <div className="container mx-auto p-6 space-y-6">
        
        {/* Header with Stats */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <PageHeader 
              title={family.name}
              description={family.description || "Manage your succession plan and beneficiaries."}
            />
            <Button onClick={() => setIsAddMemberOpen(true)} size="lg">
              <Plus className="mr-2 h-4 w-4" /> Add Member
            </Button>
          </div>

          {/* Quick Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{stats.totalMembers}</div>
                <p className="text-xs text-muted-foreground">Total Members</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{stats.totalSpouses}</div>
                <p className="text-xs text-muted-foreground">Spouses</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-amber-600">{stats.totalMinors}</div>
                <p className="text-xs text-muted-foreground">Minors</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-bold">{stats.completenessScore}%</div>
                  {stats.completenessScore >= 80 ? (
                    <Badge variant="default" className="text-xs">Complete</Badge>
                  ) : stats.completenessScore >= 50 ? (
                    <Badge variant="secondary" className="text-xs">Good</Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">Incomplete</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Completeness</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Smart Suggestions */}
        {suggestions.length > 0 && (
          <SmartSuggestions
            suggestions={suggestions}
            onAction={handleSuggestionAction}
            onDismiss={handleDismissSuggestion}
          />
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Panel: Tree Visualization (2 columns) */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Family Structure</CardTitle>
                  {stats.isPolygamous && (
                    <Badge variant="secondary">Polygamous Family</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="min-h-[500px]">
                {loadingTree ? (
                  <div className="flex items-center justify-center h-[400px]">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <FamilyTreeViz 
                    onNodeClick={handleNodeClick}
                    onAddClick={() => setIsAddMemberOpen(true)}
                  />
                )}
              </CardContent>
            </Card>

            {/* Additional Info Cards */}
            {family.homeCounty && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Cultural Context</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Home County:</span>
                      <span className="font-medium">{family.homeCounty.replace(/_/g, ' ')}</span>
                    </div>
                    {family.tribe && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tribe:</span>
                        <span className="font-medium">{family.tribe}</span>
                      </div>
                    )}
                    {family.clanName && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Clan:</span>
                        <span className="font-medium">{family.clanName}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Panel: Heirs & Intelligence (1 column) */}
          <div className="space-y-6">
            <HeirsOverview familyId={family.id} />
            
            {/* Minor Guardian Alert */}
            {stats.totalMinors > 0 && (
              <Card className="border-amber-200 bg-amber-50/50">
                <CardHeader>
                  <CardTitle className="text-sm text-amber-900">
                    Guardian Assignment Required
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-amber-800 mb-3">
                    You have {stats.totalMinors} minor{stats.totalMinors > 1 ? 's' : ''} in your family tree.
                    Assign testamentary guardians to ensure their protection.
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => {
                      // You could add logic here to open guardianship for first minor
                      setIsAddMemberOpen(false);
                    }}
                  >
                    Manage Guardianships
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Completeness Checklist */}
            {stats.completenessScore < 100 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Quick Checklist</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${stats.totalSpouses > 0 ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className={stats.totalSpouses > 0 ? 'line-through text-muted-foreground' : ''}>
                        Add spouse(s)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${(tree?.children?.length || 0) > 0 ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className={(tree?.children?.length || 0) > 0 ? 'line-through text-muted-foreground' : ''}>
                        Add children
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${(tree?.parents?.length || 0) > 0 ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className={(tree?.parents?.length || 0) > 0 ? 'line-through text-muted-foreground' : ''}>
                        Add parents
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Family Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Last Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {family.lastActivityAt 
                    ? new Date(family.lastActivityAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : 'No recent activity'
                  }
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Overlays & Modals */}
      
      {/* Create Family Dialog */}
      <CreateFamilyDialog
        isOpen={isCreateFamilyOpen}
        onClose={() => setIsCreateFamilyOpen(false)}
      />

      {/* Add Member Dialog */}
      <AddMemberDialog 
        isOpen={isAddMemberOpen} 
        onClose={() => setIsAddMemberOpen(false)} 
        familyId={family.id} 
      />

      {/* Member Detail Sheet */}
      <MemberDetailSheet 
        memberId={selectedMemberId} 
        familyId={family.id}
        onClose={() => setSelectedMemberId(null)}
        onOpenGuardianship={handleOpenGuardianship}
        onEdit={(id) => {
          // TODO: Implement edit functionality
          console.log('Edit member:', id);
          setSelectedMemberId(null);
        }}
      />

      {/* Guardianship Management Modal */}
      <Dialog 
        open={!!guardianshipWardId} 
        onOpenChange={() => setGuardianshipWardId(null)}
      >
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Guardianship Management</DialogTitle>
          </DialogHeader>
          {guardianshipWardId && (
            <GuardianshipManager 
              familyId={family.id} 
              wardId={guardianshipWardId} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FamilyDashboardPage;