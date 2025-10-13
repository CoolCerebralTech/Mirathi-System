// FILE: src/features/families/components/FamilyTree.tsx

import { useTranslation } from 'react-i18next';
import { MoreHorizontal, Edit, Trash2, Crown } from 'lucide-react';

import type { Family, FamilyMember, RelationshipType } from '../../../types';
import { Avatar } from '../../../components/common/Avatar';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../components/ui/DropdownMenu';
import { Card } from '../../../components/ui/Card';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface FamilyTreeProps {
  family: Family;
  currentUserId?: string;
  onEditMember?: (member: FamilyMember) => void;
  onRemoveMember?: (member: FamilyMember) => void;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getInitials = (firstName: string, lastName: string): string => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

const getRelationshipInfo = (role: RelationshipType) => {
  const relationships = {
    SPOUSE: { icon: '💑', label: 'Spouse', color: 'bg-pink-100 text-pink-700' },
    CHILD: { icon: '👶', label: 'Child', color: 'bg-blue-100 text-blue-700' },
    PARENT: { icon: '👨', label: 'Parent', color: 'bg-purple-100 text-purple-700' },
    SIBLING: { icon: '👫', label: 'Sibling', color: 'bg-emerald-100 text-emerald-700' },
    OTHER: { icon: '👤', label: 'Other', color: 'bg-slate-100 text-slate-700' },
  };
  return relationships[role] || relationships.OTHER;
};

// Group members by relationship type
const groupMembersByRelationship = (members: FamilyMember[]) => {
  const groups: Record<RelationshipType, FamilyMember[]> = {
    SPOUSE: [],
    CHILD: [],
    PARENT: [],
    SIBLING: [],
    OTHER: [],
  };

  members.forEach(member => {
    groups[member.role].push(member);
  });

  return groups;
};

// ============================================================================
// COMPONENT
// ============================================================================

export function FamilyTree({ 
  family, 
  currentUserId,
  onEditMember, 
  onRemoveMember 
}: FamilyTreeProps) {
  const { t } = useTranslation(['families', 'common']);

  const members = family.members || [];
  const groupedMembers = groupMembersByRelationship(members);

  const renderMemberCard = (member: FamilyMember) => {
    const user = member.user;
    if (!user) return null;

    const relationshipInfo = getRelationshipInfo(member.role);
    const isCreator = member.userId === family.creatorId;
    const isCurrentUser = member.userId === currentUserId;

    return (
      <Card key={member.userId} className="p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            <Avatar
              src={undefined}
              alt={`${user.firstName} ${user.lastName}`}
              fallback={getInitials(user.firstName, user.lastName)}
              className="h-12 w-12"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {user.firstName} {user.lastName}
                </span>
                {isCreator && (
                  <Badge variant="outline" className="gap-1">
                    <Crown className="h-3 w-3" />
                    Creator
                  </Badge>
                )}
                {isCurrentUser && (
                  <Badge variant="secondary">You</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <Badge 
                variant="outline" 
                className={`mt-2 ${relationshipInfo.color}`}
              >
                <span className="mr-1">{relationshipInfo.icon}</span>
                {relationshipInfo.label}
              </Badge>
            </div>
          </div>

          {/* Actions */}
          {!isCreator && (onEditMember || onRemoveMember) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{t('families:actions')}</DropdownMenuLabel>
                
                {onEditMember && (
                  <DropdownMenuItem onClick={() => onEditMember(member)}>
                    <Edit className="mr-2 h-4 w-4" />
                    {t('families:change_relationship')}
                  </DropdownMenuItem>
                )}

                {onRemoveMember && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => onRemoveMember(member)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {t('families:remove_member')}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Parents */}
      {groupedMembers.PARENT.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t('families:parents')}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {groupedMembers.PARENT.map(renderMemberCard)}
          </div>
        </div>
      )}

      {/* Spouses */}
      {groupedMembers.SPOUSE.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t('families:spouses')}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {groupedMembers.SPOUSE.map(renderMemberCard)}
          </div>
        </div>
      )}

      {/* Children */}
      {groupedMembers.CHILD.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t('families:children')}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {groupedMembers.CHILD.map(renderMemberCard)}
          </div>
        </div>
      )}

      {/* Siblings */}
      {groupedMembers.SIBLING.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t('families:siblings')}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {groupedMembers.SIBLING.map(renderMemberCard)}
          </div>
        </div>
      )}

      {/* Other */}
      {groupedMembers.OTHER.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t('families:other_members')}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {groupedMembers.OTHER.map(renderMemberCard)}
          </div>
        </div>
      )}

      {/* Empty State */}
      {members.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-lg font-medium text-muted-foreground">
            {t('families:no_members')}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('families:no_members_description')}
          </p>
        </div>
      )}
    </div>
  );
}