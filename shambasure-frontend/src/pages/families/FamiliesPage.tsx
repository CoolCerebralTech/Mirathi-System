// FILE: src/pages/families/FamiliesPage.tsx

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { UserPlus, Link2 } from 'lucide-react';

import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/Dialog';

import { FamilyTree } from '../../features/families/components/FamilyTree';
import { InviteMemberForm } from '../../features/families/components/InviteMemberForm';
import { CreateRelationshipForm } from '../../features/families/components/CreateRelationshipForm';

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// COMPONENT
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

/**
 * The main dashboard page for viewing and managing the user's family tree.
 * It serves as the central hub for viewing relationships, inviting new members,
 * and creating connections with existing users.
 */
export function FamiliesPage() {
  const { t } = useTranslation(['families', 'common']);

  const [isInviteOpen, setIsInviteOpen] = React.useState(false);
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);

  const handleInviteSuccess = () => setIsInviteOpen(false);
  const handleCreateSuccess = () => setIsCreateOpen(false);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('page_title')}
        description={t('page_description')}
        actions={
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={() => setIsCreateOpen(true)} variant="outline">
              <Link2 className="mr-2 h-4 w-4" />
              {t('add_existing_member_button')}
            </Button>
            <Button onClick={() => setIsInviteOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              {t('invite_member_button')}
            </Button>
          </div>
        }
      />

      <FamilyTree />

      {/* --- Invite New Member Dialog --- */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('invite_member_modal_title')}</DialogTitle>
            <DialogDescription>{t('invite_member_modal_description')}</DialogDescription>
          </DialogHeader>
          <InviteMemberForm
            onSuccess={handleInviteSuccess}
            onCancel={() => setIsInviteOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* --- Create Relationship with Existing Member Dialog --- */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('add_existing_member_modal_title')}</DialogTitle>
            <DialogDescription>{t('add_existing_member_modal_description')}</DialogDescription>
          </DialogHeader>
          <CreateRelationshipForm
            onSuccess={handleCreateSuccess}
            onCancel={() => setIsCreateOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
