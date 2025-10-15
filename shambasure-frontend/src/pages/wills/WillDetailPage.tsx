// FILE: src/pages/WillDetailPage.tsx

import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Edit, FileText, Users, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

import { useWill } from '../../features/wills/wills.api';
import { BeneficiaryAssignmentList } from '../../features/wills/components/BeneficiaryAssignmentList';
import { WillForm } from '../../features/wills/components/WillForm';

import { PageHeader } from '../../components/common/PageHeader';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/Dialog';

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// HELPER
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'ACTIVE': return 'success';
    case 'REVOKED': case 'EXECUTED': return 'destructive';
    default: return 'secondary';
  }
};

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// COMPONENT
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

/**
 * A detail page for viewing a single will, its metadata, and its beneficiary assignments.
 * Provides an entry point to edit the will's contents.
 */
export function WillDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation(['wills', 'common']);

  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);

  const { data: will, isLoading, isError } = useWill(id);

  if (isLoading) {
    return <div className="flex h-96 items-center justify-center"><LoadingSpinner size="lg" /></div>;
  }

  if (isError || !will) {
    return (
      <div className="text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
        <h3 className="mt-4 text-xl font-semibold">{t('will_not_found_title')}</h3>
        <p className="mt-2 text-muted-foreground">{t('will_not_found_description')}</p>
        <Button onClick={() => navigate('/dashboard/wills')} variant="outline" className="mt-6">
          {t('back_to_wills')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={will.title}
        description={t('detail_page_description')}
        showBackButton
        backButtonHref="/dashboard/wills"
        actions={
          <Button onClick={() => setIsEditModalOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            {t('edit_will_button')}
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* --- Left Column: Assignments --- */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <span>{t('beneficiary_assignments')}</span>
              </CardTitle>
              <CardDescription>{t('beneficiary_assignments_summary')}</CardDescription>
            </CardHeader>
            <CardContent>
              <BeneficiaryAssignmentList will={will} />
            </CardContent>
          </Card>
        </div>

        {/* --- Right Column: Metadata --- */}
        <div className="lg:col-span-1">
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                <span>{t('will_information')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('status')}</span>
                <Badge variant={getStatusBadgeVariant(will.status)}>
                  {t(`status_options.${will.status}`)}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('created_on')}</span>
                <span className="font-medium">{format(new Date(will.createdAt), 'PP')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('last_updated')}</span>
                <span className="font-medium">{format(new Date(will.updatedAt), 'PP')}</span>
              </div>
              {/* TODO: Add Executor and Witness display here */}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* --- Edit Will Dialog --- */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{t('edit_will_modal_title')}</DialogTitle>
            <DialogDescription>{t('edit_will_modal_description')}</DialogDescription>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto p-1 pr-4">
            <WillForm
              will={will}
              onSuccess={() => setIsEditModalOpen(false)}
              onCancel={() => setIsEditModalOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
