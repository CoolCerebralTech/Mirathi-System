// FILE: src/pages/family/FamilyDashboardPage.tsx

import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Users, 
  GitBranch, 
  ShieldCheck, 
  Plus, 
  UserPlus, 
  HeartHandshake, 
  Home 
} from 'lucide-react';

import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '../../components/ui';
import { LoadingSpinner, PageHeader } from '../../components/common';

// Features
import { 
  FamilyStats, 
  SuccessionReadinessCard, 
  FamilyTree, 
  PolygamyDistributionView, 
  FamilyMemberCard,
  AddMemberForm,
  RegisterMarriageForm,
  EstablishHouseForm,
  LegalStatusBadge
} from '../../features/family/components';

import { 
  useFamilyDashboard, 
  useFamilyGraph 
} from '../../features/family/family.api';

import { type FamilyMemberResponse } from '../../types/family.types';

export const FamilyDashboardPage: React.FC = () => {
  const { id: familyId } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState('members');
  
  // Modal States
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isMarriageOpen, setIsMarriageOpen] = useState(false);
  const [isHouseOpen, setIsHouseOpen] = useState(false);

  // 1. Fetch Dashboard Data
  const { 
    data: dashboard, 
    isLoading: isDashboardLoading 
  } = useFamilyDashboard(familyId!);

  // 2. Fetch Graph (Used for Members List & Tree)
  const { 
    data: graph, 
    isLoading: isGraphLoading 
  } = useFamilyGraph(familyId!);

  if (isDashboardLoading || isGraphLoading || !familyId) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size="lg" text="Loading estate context..." />
      </div>
    );
  }

  if (!dashboard || !graph) return <div>Estate not found.</div>;

  // 3. Robust Data Transformation (No 'any')
  // We map the lightweight GraphNode to the full FamilyMemberResponse structure.
  // We fill missing API data with safe defaults for the UI list view.
  const memberList: FamilyMemberResponse[] = graph.nodes.map((node) => {
    const nameParts = node.data.fullName.split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';

    return {
      id: node.id,
      familyId: familyId,
      identity: {
          fullName: node.data.fullName,
          officialName: node.data.fullName,
          first: firstName,
          last: lastName,
          gender: node.data.gender,
          dateOfBirth: node.data.dateOfBirth,
          // age is optional
      },
      vitalStatus: { 
          isAlive: node.data.isAlive, 
          isMissing: false 
      },
      verification: { 
          isVerified: node.data.isVerified, 
          status: node.data.isVerified ? 'VERIFIED' : 'PENDING' 
      },
      polygamyContext: { 
          isPolygamousFamily: dashboard.structure.polygamyStatus !== 'MONOGAMOUS', 
          belongsToHouseName: node.data.houseColor ? 'House Member' : undefined,
          // 'isHouseHead' was missing in your original code causing the type error
          isHouseHead: node.data.isHeadOfFamily 
      },
      legalStatus: { 
          isMinor: false, 
          isAdult: true, // Defaulting for list view if age unknown
          hasGuardian: false,
          qualifiesForS29: false, 
          inheritanceEligibility: 'FULL' 
      },
      // 'context' was missing in your original code
      context: {
          // These are optional in the type definition, but the object itself is required
      },
      kinship: { 
          parents: [], 
          spouses: [], 
          children: [], 
          siblings: [] 
      }
    };
  });

  return (
    <div className="flex flex-col gap-6 p-6 pb-20">
      
      {/* A. Header & Stats */}
      <div className="flex flex-col gap-6">
        <div className="flex items-start justify-between">
             <PageHeader 
                title={dashboard.name} 
                description={`Estate Administered in ${dashboard.county}`} 
             />
             <div className="flex items-center gap-2">
                 <LegalStatusBadge 
                    status={{
                        isMinor: false, isAdult: true, hasGuardian: false, qualifiesForS29: false, 
                        inheritanceEligibility: dashboard.completeness.score > 80 ? 'FULL' : 'PENDING_VERIFICATION'
                    }} 
                    className="h-8"
                 />
             </div>
        </div>

        <FamilyStats stats={dashboard.stats} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        
        {/* B. Left Panel: Main Content */}
        <div className="lg:col-span-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="members">
                <Users className="mr-2 h-4 w-4" /> Members
              </TabsTrigger>
              <TabsTrigger value="structure">
                <GitBranch className="mr-2 h-4 w-4" /> Family Tree
              </TabsTrigger>
              <TabsTrigger value="analysis">
                <ShieldCheck className="mr-2 h-4 w-4" /> Legal Analysis
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: MEMBERS */}
            <TabsContent value="members" className="space-y-4">
              <div className="flex justify-end gap-2">
                 <Button variant="outline" size="sm" onClick={() => setIsMarriageOpen(true)}>
                    <HeartHandshake className="mr-2 h-4 w-4" /> Register Marriage
                 </Button>
                 <Button size="sm" onClick={() => setIsAddMemberOpen(true)}>
                    <UserPlus className="mr-2 h-4 w-4" /> Add Member
                 </Button>
              </div>

              <div className="grid gap-4">
                {memberList.map((member) => (
                  <FamilyMemberCard 
                    key={member.id} 
                    member={member} 
                    onVerify={(id) => console.log('Verify', id)}
                  />
                ))}
              </div>
            </TabsContent>

            {/* TAB 2: STRUCTURE */}
            <TabsContent value="structure" className="space-y-6">
               <FamilyTree familyId={familyId} />
               
               {dashboard.structure.polygamyStatus !== 'MONOGAMOUS' && (
                  <div className="mt-8">
                      <div className="mb-4 flex items-center justify-between">
                          <h3 className="text-lg font-semibold">Polygamous Distribution</h3>
                          <Button variant="outline" size="sm" onClick={() => setIsHouseOpen(true)}>
                              <Home className="mr-2 h-4 w-4" /> Establish House
                          </Button>
                      </div>
                      <PolygamyDistributionView familyId={familyId} />
                  </div>
               )}
            </TabsContent>

            {/* TAB 3: ANALYSIS */}
            <TabsContent value="analysis">
                <div className="space-y-6">
                    <SuccessionReadinessCard familyId={familyId} />
                    
                    {/* Placeholder for future detailed analysis widgets */}
                    <div className="rounded-lg border p-6 text-center text-muted-foreground">
                        Detailed S.29 Dependency Reports and S.35/38 Distribution Matrix 
                        will appear here once membership data is complete.
                    </div>
                </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* C. Right Panel: Readiness & Actions */}
        <div className="space-y-6 lg:col-span-4">
            <SuccessionReadinessCard familyId={familyId} />
            
            <div className="rounded-xl border bg-slate-50 p-4">
                <h4 className="mb-3 font-semibold">Quick Actions</h4>
                <div className="flex flex-col gap-2">
                    <Button variant="secondary" className="justify-start" onClick={() => setIsAddMemberOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Add Beneficiary
                    </Button>
                    <Button variant="secondary" className="justify-start" onClick={() => setIsMarriageOpen(true)}>
                        <HeartHandshake className="mr-2 h-4 w-4" /> Record Marriage
                    </Button>
                    {dashboard.structure.polygamyStatus !== 'MONOGAMOUS' && (
                        <Button variant="secondary" className="justify-start" onClick={() => setIsHouseOpen(true)}>
                            <Home className="mr-2 h-4 w-4" /> Manage Houses
                        </Button>
                    )}
                </div>
            </div>
        </div>

      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Dialogs */}
      {/* ------------------------------------------------------------------ */}

      {/* 1. Add Member */}
      <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
        <DialogContent className="sm:max-w-lg">
            <DialogHeader>
                <DialogTitle>Add Family Member</DialogTitle>
            </DialogHeader>
            <AddMemberForm 
                familyId={familyId} 
                onSuccess={() => setIsAddMemberOpen(false)}
                onCancel={() => setIsAddMemberOpen(false)}
            />
        </DialogContent>
      </Dialog>

      {/* 2. Register Marriage */}
      <Dialog open={isMarriageOpen} onOpenChange={setIsMarriageOpen}>
        <DialogContent className="sm:max-w-lg">
            <DialogHeader>
                <DialogTitle>Register Marriage</DialogTitle>
            </DialogHeader>
            <RegisterMarriageForm 
                familyId={familyId} 
                members={memberList}
                onSuccess={() => setIsMarriageOpen(false)}
                onCancel={() => setIsMarriageOpen(false)}
            />
        </DialogContent>
      </Dialog>

      {/* 3. Establish House */}
      <Dialog open={isHouseOpen} onOpenChange={setIsHouseOpen}>
        <DialogContent className="sm:max-w-lg">
            <DialogHeader>
                <DialogTitle>Establish Polygamous House</DialogTitle>
            </DialogHeader>
            <EstablishHouseForm 
                familyId={familyId} 
                members={memberList}
                onSuccess={() => setIsHouseOpen(false)}
                onCancel={() => setIsHouseOpen(false)}
            />
        </DialogContent>
      </Dialog>

    </div>
  );
};