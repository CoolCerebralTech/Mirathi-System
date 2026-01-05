// FILE: src/pages/family/FamilyDashboardPage.tsx

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import {  Button } from '@/components/ui'; // Assuming these exist in your UI index
import { FamilyTreeViz } from '@/features/family/components/FamilyTreeViz';
import { AddMemberDialog } from '@/features/family/components/AddMemberDialog';
import { MemberDetailSheet } from '@/features/family/components/MemberDetailSheet';
import { HeirsOverview } from '@/features/family/components/HeirsOverview';
import { GuardianshipManager } from '@/features/family/components/GuardianshipManager';
import { useMyFamily } from '@/features/family/family.api';

import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui';
import { PageHeader } from '@/components/common';

export const FamilyDashboardPage: React.FC = () => {
  // State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [guardianshipWardId, setGuardianshipWardId] = useState<string | null>(null);

  // Data
  const { data: family } = useMyFamily();

  // Handlers
  const handleNodeClick = (id: string) => setSelectedMemberId(id);
  
  const handleOpenGuardianship = (id: string) => {
    setSelectedMemberId(null); // Close sheet
    setGuardianshipWardId(id); // Open Guardianship Modal
  };

  if (!family) return <div className="p-8">Loading your estate...</div>;

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      <div className="container mx-auto p-6 space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <PageHeader 
            title={family.name}
            description="Manage your succession plan and beneficiaries."
          />
          <Button onClick={() => setIsAddOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Member
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Panel: Tree Visualization */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-xl border bg-white p-6 shadow-sm min-h-[500px]">
               <h3 className="mb-6 font-semibold text-lg text-slate-800">Family Structure</h3>
               <FamilyTreeViz 
                 onNodeClick={handleNodeClick}
                 onAddClick={() => setIsAddOpen(true)}
               />
            </div>
          </div>

          {/* Right Panel: Intelligence & Heirs */}
          <div className="space-y-6">
             <HeirsOverview familyId={family.id} />
             
             {/* Future: Add more widgets here like 'Asset Summary' */}
          </div>

        </div>
      </div>

      {/* --- Overlays --- */}

      <AddMemberDialog 
        isOpen={isAddOpen} 
        onClose={() => setIsAddOpen(false)} 
        familyId={family.id} 
      />

      <MemberDetailSheet 
        memberId={selectedMemberId} 
        familyId={family.id}
        onClose={() => setSelectedMemberId(null)}
        onOpenGuardianship={handleOpenGuardianship}
      />

      {/* Guardianship Modal (Reusing Dialog for simplicity) */}
      <Dialog open={!!guardianshipWardId} onOpenChange={() => setGuardianshipWardId(null)}>
        <DialogContent className="sm:max-w-md">
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