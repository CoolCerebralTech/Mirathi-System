// ============================================================================
// FILE 6: MemberDetailSheet.tsx
// ============================================================================

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
import { useRemoveFamilyMember, useFamilyTree } from '../family.api';
import { cn } from '@/lib/utils';
import type { Gender } from '@/types/family.types';

interface MemberDetailSheetProps {
  memberId: string | null;
  familyId: string;
  onClose: () => void;
  onOpenGuardianship: (memberId: string) => void;
  onEdit?: (memberId: string) => void;
}

interface NormalizedMember {
  id: string;
  name: string;
  role: string;
  isAlive: boolean;
  isMinor: boolean;
  gender?: Gender;
  type: 'ROOT' | 'SPOUSE' | 'CHILD' | 'PARENT';
  houseName?: string;
  age?: number;
}

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

  // Helper to find and normalize member
  const getNormalizedMember = (id: string | null): NormalizedMember | null => {
    if (!id || !tree) return null;

    // Check Root
    if (tree.id === id) {
      return {
        id: tree.id,
        name: tree.name,
        role: tree.role || 'SELF',
        isAlive: tree.isAlive ?? true,
        isMinor: tree.isMinor ?? false,
        gender: tree.gender,
        age: tree.age,
        type: 'ROOT'
      };
    }

    // Check Spouses
    const spouse = tree.spouses?.find(s => s.id === id);
    if (spouse) {
      return {
        id: spouse.id,
        name: spouse.name,
        role: spouse.role || 'SPOUSE',
        isAlive: spouse.isAlive ?? true,
        isMinor: false,
        gender: spouse.gender,
        houseName: spouse.houseName,
        type: 'SPOUSE'
      };
    }

    // Check Children
    const child = tree.children?.find(c => c.id === id);
    if (child) {
      return {
        id: child.id,
        name: child.name,
        role: child.role || 'CHILD',
        isAlive: child.isAlive ?? true,
        isMinor: child.isMinor,
        gender: child.gender,
        age: child.age,
        type: 'CHILD'
      };
    }

    // Check Parents
    const parent = tree.parents?.find(p => p.id === id);
    if (parent) {
      return {
        id: parent.id,
        name: parent.name,
        role: parent.role,
        isAlive: parent.isAlive ?? true,
        isMinor: false,
        gender: parent.gender,
        type: 'PARENT'
      };
    }

    return null;
  };

  const member = getNormalizedMember(memberId);

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

  const isMe = member.type === 'ROOT';

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to remove ${member.name} from your succession plan?`)) {
      removeMember(memberId!);
    }
  };

  const getRoleDisplay = (role: string) => {
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

  const getGenderIcon = (gender?: Gender) => {
    if (gender === 'MALE') return '♂';
    if (gender === 'FEMALE') return '♀';
    return '';
  };

  return (
    <Sheet open={!!memberId} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-[500px] overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-2 flex-wrap">
            <SheetTitle className="flex items-center gap-2">
              {member.name}
              {member.gender && (
                <span className="text-muted-foreground text-base font-normal">
                  {getGenderIcon(member.gender)}
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
            {getRoleDisplay(member.role)}
          </SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-6">
          {/* Quick Stats */}
          {(member.age !== undefined || member.gender) && (
            <div className="grid grid-cols-2 gap-4">
              {member.age !== undefined && (
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
          )}

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
                    {member.role === 'SPOUSE' && 'Entitled to spousal share under intestate succession'}
                    {member.role === 'CHILD' && 'Entitled to children\'s share under intestate succession'}
                    {member.role === 'ADOPTED_CHILD' && 'Has same inheritance rights as biological children'}
                    {(member.role === 'FATHER' || member.role === 'MOTHER') && 'May inherit if no spouse or children'}
                    {member.role === 'SIBLING' && 'May inherit if no closer relatives exist'}
                    {member.role === 'SELF' && 'Primary owner of the estate'}
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

          {/* Status Information */}
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

        <SheetFooter className="border-t pt-4">
          <Button variant="outline" onClick={onClose} className="w-full">
            Close
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};