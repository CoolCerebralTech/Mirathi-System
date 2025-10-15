// FILE: src/features/families/components/FamilyTree.tsx

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { MoreHorizontal, Edit, Trash2, User, AlertTriangle } from 'lucide-react';

import type { Relationship, User as UserNode } from '../../../types';
import { useFamilyTree, useDeleteRelationship } from '../families.api';
import { useAuthStore } from '../../../store/auth.store';
import { toast } from 'sonner';
import { extractErrorMessage } from '../../../api/client';

import { Avatar } from '../../../components/common/Avatar';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../../components/ui/DropdownMenu';
import { Card } from '../../../components/ui/Card';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../../components/ui/AlertDialog';

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// TYPE DEFINITIONS
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

interface FamilyTreeProps {
  onEditRelationship?: (relationship: Relationship) => void;
}

interface GroupedMembers {
  [key: string]: { user: UserNode; relationship: Relationship }[];
}

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// COMPONENT
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

/**
 * A component that fetches and displays the user's family tree,
 * grouping members by their relationship to the current user.
 */
export function FamilyTree({ onEditRelationship }: FamilyTreeProps) {
  const { t } = useTranslation(['families', 'common']);
  const currentUser = useAuthStore((state) => state.user);
  const { data: treeData, isLoading, isError } = useFamilyTree();

  const groupedMembers = React.useMemo(() => {
    if (!treeData || !currentUser) return {};

    const { nodes, edges } = treeData;
    const userMap = new Map(nodes.map(node => [node.id, node]));
    const groups: GroupedMembers = {};

    edges.forEach(edge => {
      // Process relationships where the current user is the source
      if (edge.sourceUserId === currentUser.id) {
        const targetUser = userMap.get(edge.targetUserId);
        if (targetUser) {
          if (!groups[edge.type]) groups[edge.type] = [];
          groups[edge.type].push({ user: targetUser, relationship: edge });
        }
      }
      // TODO: Process relationships where the current user is the target (e.g., someone added you as a CHILD)
    });

    return groups;
  }, [treeData, currentUser]);

  if (isLoading) {
    return <div className="flex h-96 items-center justify-center"><LoadingSpinner size="lg" /></div>;
  }

  if (isError) {
    return <div className="flex flex-col items-center justify-center rounded-lg border border-destructive/50 bg-destructive/10 p-8 text-destructive"><AlertTriangle className="h-8 w-8" /><p className="mt-2 font-medium">{t('common:error_loading_data')}</p></div>;
  }

  const relationshipOrder: (keyof GroupedMembers)[] = ['SPOUSE', 'PARTNER', 'CHILD', 'PARENT', 'SIBLING', 'OTHER'];

  return (
    <div className="space-y-8">
      {relationshipOrder.map(groupKey => {
        const members = groupedMembers[groupKey];
        if (!members || members.length === 0) return null;

        return (
          <div key={groupKey}>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {t(`relationship_group_${groupKey}`)}
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {members.map(({ user, relationship }) => (
                <FamilyMemberCard
                  key={user.id}
                  user={user}
                  relationship={relationship}
                  onEdit={onEditRelationship}
                />
              ))}
            </div>
          </div>
        );
      })}

      {!treeData || treeData.edges.length === 0 && (
         <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed rounded-lg">
            <User className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">{t('no_members_title')}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{t('no_members_description')}</p>
         </div>
      )}
    </div>
  );
}

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// CHILD COMPONENT FOR MEMBER CARD
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

interface FamilyMemberCardProps {
  user: UserNode;
  relationship: Relationship;
  onEdit?: (relationship: Relationship) => void;
}

function FamilyMemberCard({ user, relationship, onEdit }: FamilyMemberCardProps) {
  const { t } = useTranslation(['families', 'common']);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const { mutate: deleteRelationship, isPending: isDeleting } = useDeleteRelationship();

  const handleDelete = () => {
    deleteRelationship(relationship.id, {
      onSuccess: () => toast.success(t('relationship_removed_success')),
      onError: (error) => toast.error(t('relationship_removed_failed'), { description: extractErrorMessage(error) }),
      onSettled: () => setIsDeleteDialogOpen(false),
    });
  };

  const initials = `${user.firstName[0]}${user.lastName[0]}`;

  return (
    <>
      <Card className="p-4 transition-shadow hover:shadow-md">
        <div className="flex items-start justify-between">
          <div className="flex flex-1 items-center gap-4">
            <Avatar fallback={initials} className="h-12 w-12" />
            <div className="min-w-0">
              <p className="font-medium truncate">{`${user.firstName} ${user.lastName}`}</p>
              <p className="text-sm text-muted-foreground truncate">{user.email}</p>
              <Badge variant="secondary" className="mt-2">
                {t(`relationship_type_options.${relationship.type}`)}
              </Badge>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0"><MoreHorizontal className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(relationship)}>
                  <Edit className="mr-2 h-4 w-4" />
                  <span>{t('edit_relationship')}</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                <span>{t('remove_relationship')}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </Card>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common:are_you_sure')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('confirm_remove_relationship_message', { name: `${user.firstName} ${user.lastName}` })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common:cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? t('common:removing') : t('common:remove')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
