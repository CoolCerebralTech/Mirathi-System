// FILE: src/features/family/components/MemberDetailSheet.tsx

import React from 'react';
import { Trash2, UserCog, Baby, ShieldCheck } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  Button,
  Badge,
  Separator,
  Alert,
  AlertDescription,
  AlertTitle
} from '@/components/ui';
import { useRemoveMember, useFamilyTree } from '../family.api';
import { type FamilyTreeNode, RelationshipType } from '@/types/family.types';

interface MemberDetailSheetProps {
  memberId: string | null;
  familyId: string;
  onClose: () => void;
  onOpenGuardianship: (memberId: string) => void;
}

// 1. Define a Normalized Type for internal use in this component
interface NormalizedMember {
  id: string;
  name: string;
  role: string;
  isAlive: boolean;
  isMinor: boolean;
  type: 'ROOT' | 'SPOUSE' | 'CHILD' | 'PARENT';
}

export const MemberDetailSheet: React.FC<MemberDetailSheetProps> = ({ 
  memberId, 
  familyId, 
  onClose,
  onOpenGuardianship
}) => {
  const { data: tree } = useFamilyTree(familyId);
  const { mutate: removeMember, isPending: isRemoving } = useRemoveMember(familyId);

  // 2. Helper to find and Normalize the member
  const getNormalizedMember = (id: string | null, treeData?: FamilyTreeNode): NormalizedMember | null => {
    if (!id || !treeData) return null;

    // Check Root
    if (treeData.id === id) {
      return {
        id: treeData.id,
        name: treeData.name,
        role: RelationshipType.SELF,
        isAlive: treeData.isAlive,
        isMinor: false,
        type: 'ROOT'
      };
    }

    // Check Spouses
    const spouse = treeData.spouses?.find(s => s.id === id);
    if (spouse) {
      return {
        id: spouse.id,
        name: spouse.name,
        role: 'SPOUSE',
        isAlive: spouse.isAlive ?? true, // Default to true if missing
        isMinor: false,
        type: 'SPOUSE'
      };
    }

    // Check Children
    const child = treeData.children?.find(c => c.id === id);
    if (child) {
      return {
        id: child.id,
        name: child.name,
        role: 'CHILD',
        isAlive: child.isAlive ?? true,
        isMinor: child.isMinor, // Explicitly available on Child type
        type: 'CHILD'
      };
    }

    // Check Parents
    const parent = treeData.parents?.find(p => p.id === id);
    if (parent) {
      return {
        id: parent.id,
        name: parent.name,
        role: parent.role,
        isAlive: parent.isAlive ?? true,
        isMinor: false,
        type: 'PARENT'
      };
    }

    return null;
  };

  const member = getNormalizedMember(memberId, tree);

  if (!member) return null;

  const isMe = member.type === 'ROOT';

  const handleDelete = () => {
    if (confirm('Are you sure? This will remove them from your succession plan.')) {
      removeMember(memberId!, {
        onSuccess: onClose
      });
    }
  };

  return (
    <Sheet open={!!memberId} onOpenChange={onClose}>
      <SheetContent>
        <SheetHeader>
          <div className="flex items-center gap-2">
             <SheetTitle>{member.name}</SheetTitle>
             {!member.isAlive && <Badge variant="destructive">Deceased</Badge>}
             {member.isMinor && <Badge variant="outline" className="border-amber-400 text-amber-600">Minor</Badge>}
          </div>
          <SheetDescription>
            {member.role === RelationshipType.SELF ? 'Family Head (You)' : member.role}
          </SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-6">
          {/* Actions Grid */}
          <div className="grid grid-cols-2 gap-3">
             <Button variant="outline" className="justify-start" disabled>
                <UserCog className="mr-2 h-4 w-4" /> Edit Profile
             </Button>
             
             {!isMe && (
               <Button 
                  variant="outline" 
                  className="justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={handleDelete}
                  disabled={isRemoving}
               >
                  <Trash2 className="mr-2 h-4 w-4" /> 
                  {isRemoving ? 'Removing...' : 'Remove'}
               </Button>
             )}
          </div>

          <Separator />

          {/* Guardianship Section for Minors */}
          {member.isMinor && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Baby className="h-4 w-4 text-primary" />
                Guardianship Status
              </h4>
              
              <Alert className="bg-amber-50 border-amber-200">
                <ShieldCheck className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-800">Action Recommended</AlertTitle>
                <AlertDescription className="text-amber-700 text-xs">
                  Minors require a testamentary guardian in your will.
                </AlertDescription>
              </Alert>

              <Button 
                className="w-full" 
                onClick={() => onOpenGuardianship(member.id)}
              >
                Manage Guardianship
              </Button>
            </div>
          )}
        </div>

        <SheetFooter>
           {/* Footer content if needed */}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};