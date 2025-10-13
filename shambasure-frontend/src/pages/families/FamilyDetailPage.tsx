// FILE: src/pages/dashboard/FamilyDetailPage.tsx (New & Finalized)

import * as React from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, AlertTriangle, UserPlus } from 'lucide-react';

import { useFamily, useRemoveFamilyMember } from '../../features/families/families.api';
import { FamilyTree } from '../../features/families/components/FamilyTree';
import { AddFamilyMemberForm } from '../../features/families/components/AddFamilyMemberForm';
import { useCurrentUser } from '../../store/auth.store';

import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/Dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../components/ui/AlertDialog';
import { FamilyMember } from '../../types/schemas/families.schemas';
import { toast } from 'sonner';

export function FamilyDetailPage() {
  const { t } = useTranslation(['families', 'common']);
  const { id: familyId } = useParams<{ id: string }>();
  const currentUser = useCurrentUser();

  const [isAddMemberOpen, setIsAddMemberOpen] = React.useState(false);
  const [memberToRemove, setMemberToRemove] = React.useState<FamilyMember | null>(null);

  if (!familyId) {
    return <div>Invalid Family ID.</div>;
  }

  const { data: family, isLoading, isError } = useFamily(familyId);
  const removeMemberMutation = useRemoveFamilyMember();

  const handleRemoveConfirm = () => {
    if (!memberToRemove) return;
    removeMemberMutation.mutate(
      { familyId, userId: memberToRemove.userId },
      {
        onSuccess: () => {
          toast.success(t('families:remove_member_success'));
          setMemberToRemove(null);
        },
        onError: (error) => toast.error(t('common:error'), { description: error.message }),
      }
    );
  };

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center"><LoadingSpinner size="lg" /></div>;
  }

  if (isError || !family) {
    return <div className="text-center text-destructive"><AlertTriangle className="mx-auto h-8 w-8" /><p>{t('common:error_loading_data')}</p></div>;
  }

  const existingMemberIds = family.members.map(m => m.userId);

  return (
    <div className="space-y-6">
      <PageHeader
        title={family.name}
        description={t('families:detail_page_description')}
        showBackButton
        backButtonHref="/dashboard/families"
      >
        <Button onClick={() => setIsAddMemberOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          {t('families:add_member')}
        </Button>
      </PageHeader>

      <FamilyTree
        family={family}
        currentUserId={currentUser?.id}
        onRemoveMember={setMemberToRemove}
      />

      {/* Add Member Dialog */}
      <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('families:add_member_to', { name: family.name })}</DialogTitle>
            <DialogDescription>{t('families:add_member_prompt')}</DialogDescription>
          </DialogHeader>
          <AddFamilyMemberForm
            familyId={family.id}
            existingMemberIds={existingMemberIds}
            onSuccess={() => setIsAddMemberOpen(false)}
            onCancel={() => setIsAddMemberOpen(false)}
          />
        </DialogContent>
      </Dialog>
      
      {/* Remove Member Confirmation */}
      <AlertDialog open={!!memberToRemove} onOpenChange={() => setMemberToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common:are_you_sure')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('families:remove_member_confirm', { name: memberToRemove?.user.firstName })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common:cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveConfirm} disabled={removeMemberMutation.isPending}>
              {t('common:confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}