// FILE: src/components/family/MemberDetailSheet.tsx

import React from 'react';
import { 
  Trash2, 
  UserCog, 
  Baby, 
  ShieldCheck, 
  Calendar,
  FileText,
  Loader2,
  AlertCircle,
} from 'lucide-react';
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
  AlertTitle,
} from '@/components/ui';
import { useRemoveFamilyMember, useFamilyTree } from '@/api/family/family.api';
import { cn } from '@/lib/utils';
import type { 
  Gender, 
  FamilyTreeNode
} from '@/types/family.types';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface MemberDetailSheetProps {
  memberId: string | null;
  familyId: string;
  onClose: () => void;
  onOpenGuardianship: (memberId: string) => void;
  onEdit?: (memberId: string) => void;
}

/**
 * Member type used internally - union of possible member sources
 */
type MemberType = 'ROOT' | 'SPOUSE' | 'CHILD' | 'PARENT';

interface NormalizedMember {
  id: string;
  name: string;
  role: string;
  isAlive: boolean;
  isMinor: boolean;
  gender?: Gender;
  type: MemberType;
  houseName?: string | null;
  age?: number | null;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Finds a member in the tree and normalizes their data structure
 */
const findAndNormalizeMember = (
  tree: FamilyTreeNode | undefined,
  memberId: string | null
): NormalizedMember | null => {
  if (!memberId || !tree) return null;

  // Check Root (Self)
  if (tree.id === memberId) {
    return {
      id: tree.id,
      name: tree.name,
      role: tree.role || 'SELF',
      isAlive: tree.isAlive,
      isMinor: false, // Root is always adult
      gender: tree.gender ?? undefined,
      age: undefined, // Age not available on root in this view
      type: 'ROOT',
    };
  }

  // Check Spouses
  if (tree.spouses) {
    const spouse = tree.spouses.find((s) => s.id === memberId);
    if (spouse) {
      return {
        id: spouse.id,
        name: spouse.name,
        role: 'SPOUSE', // TreeSpouse role is optional or string
        isAlive: true, // Spouses in tree are assumed alive
        isMinor: false, // Spouses are adults
        gender: undefined, 
        houseName: spouse.houseName ?? undefined,
        age: undefined,
        type: 'SPOUSE',
      };
    }
  }

  // Check Children
  if (tree.children) {
    const child = tree.children.find((c) => c.id === memberId);
    if (child) {
      return {
        id: child.id,
        name: child.name,
        role: 'CHILD', // TreeChild role is string
        isAlive: true, // Children in tree are assumed alive
        isMinor: child.isMinor,
        gender: undefined, 
        age: undefined,
        houseName: undefined,
        type: 'CHILD',
      };
    }
  }

  // Check Parents
  if (tree.parents) {
    const parent = tree.parents.find((p) => p.id === memberId);
    if (parent) {
      return {
        id: parent.id,
        name: parent.name,
        role: parent.role,
        isAlive: true, // Explicit on parent node
        isMinor: false, // Parents are adults
        gender: undefined, // Parent node gender might be missing in summary
        age: undefined,
        houseName: undefined,
        type: 'PARENT',
      };
    }
  }

  return null;
};

/**
 * Maps role enum to human-readable display text
 */
const getRoleDisplayText = (role: string): string => {
  const roleMap: Record<string, string> = {
    'SELF': 'Family Head (You)',
    'SPOUSE': 'Spouse',
    'CHILD': 'Child',
    'ADOPTED_CHILD': 'Adopted Child',
    'FATHER': 'Father',
    'MOTHER': 'Mother',
    'SIBLING': 'Sibling',
    'HALF_SIBLING': 'Half Sibling',
  };
  
  return roleMap[role] || role;
};

/**
 * Returns gender symbol for display
 */
const getGenderSymbol = (gender?: Gender): string => {
  if (gender === 'MALE') return '♂';
  if (gender === 'FEMALE') return '♀';
  return '';
};

/**
 * Gets succession rights description based on role
 */
const getSuccessionRightsText = (role: string): string => {
  const normalizedRole = role.toUpperCase();
  
  const rightsMap: Record<string, string> = {
    'SPOUSE': 'Entitled to spousal share under intestate succession',
    'CHILD': 'Entitled to children\'s share under intestate succession',
    'ADOPTED_CHILD': 'Has same inheritance rights as biological children',
    'FATHER': 'May inherit if no spouse or children',
    'MOTHER': 'May inherit if no spouse or children',
    'SIBLING': 'May inherit if no closer relatives exist',
    'SELF': 'Primary owner of the estate',
  };
  
  return rightsMap[normalizedRole] || 'Refer to Kenyan Succession Law for details';
};

// ============================================================================
// COMPONENT
// ============================================================================

export const MemberDetailSheet: React.FC<MemberDetailSheetProps> = ({ 
  memberId, 
  familyId, 
  onClose,
  onOpenGuardianship,
  onEdit,
}) => {
  const { data: tree, isLoading } = useFamilyTree(familyId);
  const { mutate: removeMember, isPending: isRemoving } = useRemoveFamilyMember(familyId, {
    onSuccess: onClose
  });

  const member = findAndNormalizeMember(tree, memberId);
  const isMe = member?.type === 'ROOT';

  const handleDelete = (): void => {
    if (!member || !memberId) return;
    
    const confirmed = window.confirm(
      `Are you sure you want to remove ${member.name} from your succession plan?`
    );
    
    if (confirmed) {
      removeMember(memberId);
    }
  };

  // Loading State
  if (isLoading) {
    return (
      <Sheet open={!!memberId} onOpenChange={onClose}>
        <SheetContent>
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Not Found State
  if (!member) {
    return (
      <Sheet open={!!memberId} onOpenChange={onClose}>
        <SheetContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Member not found</AlertDescription>
          </Alert>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={!!memberId} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-[500px] overflow-y-auto">
        {/* Header */}
        <SheetHeader>
          <div className="flex items-center gap-2 flex-wrap">
            <SheetTitle className="flex items-center gap-2">
              {member.name}
              {member.gender && (
                <span className="text-muted-foreground text-base font-normal">
                  {getGenderSymbol(member.gender)}
                </span>
              )}
            </SheetTitle>
            
            {!member.isAlive && (
              <Badge variant="destructive">Deceased</Badge>
            )}
            
            {member.isMinor && (
              <Badge variant="outline" className="border-amber-400 bg-amber-50 text-amber-600">
                Minor
              </Badge>
            )}

            {member.houseName && (
              <Badge variant="secondary">{member.houseName}</Badge>
            )}
          </div>
          
          <SheetDescription>
            {getRoleDisplayText(member.role)}
          </SheetDescription>
        </SheetHeader>

        {/* Content */}
        <div className="py-6 space-y-6">
          {/* Quick Stats */}
          {(member.age !== undefined && member.age !== null) || member.gender ? (
            <div className="grid grid-cols-2 gap-4">
              {member.age !== undefined && member.age !== null && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{member.age} years old</span>
                </div>
              )}
              {member.gender && (
                <div className="flex items-center gap-2 text-sm">
                  <UserCog className="h-4 w-4 text-muted-foreground" />
                  <span>{member.gender}</span>
                </div>
              )}
            </div>
          ) : null}

          <Separator />

          {/* Action Buttons */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Actions</h4>
            
            <div className="grid grid-cols-1 gap-2">
              {onEdit && (
                <Button 
                  variant="outline" 
                  className="justify-start"
                  onClick={() => onEdit(member.id)}
                >
                  <UserCog className="mr-2 h-4 w-4" /> 
                  Edit Profile
                </Button>
              )}
              
              {!isMe && (
                <Button 
                  variant="outline" 
                  className={cn(
                    "justify-start",
                    "text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-200"
                  )}
                  onClick={handleDelete}
                  disabled={isRemoving}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> 
                  {isRemoving ? 'Removing...' : 'Remove from Family Tree'}
                </Button>
              )}
            </div>
          </div>

          <Separator />

          {/* Guardianship Section for Minors */}
          {member.isMinor && member.isAlive && (
            <>
              <div className="space-y-3">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Baby className="h-4 w-4 text-primary" />
                  Guardianship Status
                </h4>
                
                <Alert className="bg-amber-50 border-amber-200">
                  <ShieldCheck className="h-4 w-4 text-amber-600" />
                  <AlertTitle className="text-amber-800">Action Required</AlertTitle>
                  <AlertDescription className="text-amber-700 text-sm">
                    Minors require a testamentary guardian in your will (Section 70, Children Act).
                    Assign a guardian to ensure proper care and protection.
                  </AlertDescription>
                </Alert>

                <Button 
                  className="w-full" 
                  onClick={() => onOpenGuardianship(member.id)}
                >
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Manage Guardianship
                </Button>
              </div>
              
              <Separator />
            </>
          )}

          {/* Legal Information */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Legal Context</h4>
            
            <div className="rounded-lg border p-4 bg-slate-50 space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">Succession Rights</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {getSuccessionRightsText(member.role)}
                  </p>
                </div>
              </div>

              {member.isMinor && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">
                    <strong>Note:</strong> Minor's inheritance will be held in trust until age of majority (18 years).
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Deceased Status */}
          {!member.isAlive && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Status</h4>
              
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Deceased</AlertTitle>
                <AlertDescription className="text-sm">
                  This member is marked as deceased. Their succession rights may pass to their descendants
                  per stirpes (by representation).
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>

        {/* Footer */}
        <SheetFooter className="border-t pt-4">
          <Button variant="outline" onClick={onClose} className="w-full">
            Close
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};