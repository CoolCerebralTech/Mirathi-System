// FILE: src/pages/WillDetailPage.tsx

import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Plus, Edit, FileText, Users } from 'lucide-react';
import { format } from 'date-fns';

import { 
  useWill, 
  useRemoveBeneficiary 
} from '../../features/wills/wills.api';
import { getBeneficiaryAssignmentColumns } from '../../features/wills/components/BeneficiaryAssignmentsTable';
import { BeneficiaryAssignmentForm } from '../../features/wills/components/BeneficiaryAssignmentForm';
import { WillForm } from '../../features/wills/components/WillForm';
import { toast } from 'sonner';
import { extractErrorMessage } from '../../api/client';

import { Button } from '../../components/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { DataTable } from '../../components/ui/DataTable';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/Dialog';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getStatusInfo = (status: string): { 
  label: string; 
  color: string; 
  variant: BadgeVariant 
} => {
  const statuses: Record<string, { 
    label: string; 
    color: string; 
    variant: BadgeVariant 
  }> = {
    DRAFT: { label: 'Draft', color: 'bg-slate-100 text-slate-700', variant: 'secondary' },
    ACTIVE: { label: 'Active', color: 'bg-emerald-100 text-emerald-700', variant: 'default' },
    REVOKED: { label: 'Revoked', color: 'bg-red-100 text-red-700', variant: 'destructive' },
    EXECUTED: { label: 'Executed', color: 'bg-blue-100 text-blue-700', variant: 'outline' },
  };
  return statuses[status] || statuses.DRAFT;
};

// ============================================================================
// COMPONENT
// ============================================================================

export function WillDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation(['wills', 'common']);

  // State
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = React.useState(false);
  const [deleteAssignmentDialogOpen, setDeleteAssignmentDialogOpen] = React.useState(false);
  const [selectedAssignmentId, setSelectedAssignmentId] = React.useState<string | null>(null);

  // API Hooks
  const { data: will, isLoading } = useWill(id || '');
  const removeAssignmentMutation = useRemoveBeneficiary();

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleRemoveAssignment = () => {
    if (!selectedAssignmentId || !will) return;

    removeAssignmentMutation.mutate(
      { willId: will.id, assignmentId: selectedAssignmentId },
      {
        onSuccess: () => {
          toast.success(t('wills:assignment_removed_success'));
          setDeleteAssignmentDialogOpen(false);
          setSelectedAssignmentId(null);
        },
        onError: (error) => {
          const errorMessage = extractErrorMessage(error);
          toast.error(errorMessage, {
            description: t('common:error')
          });
        },
      }
    );
  };

  // ============================================================================
  // TABLE COLUMNS
  // ============================================================================

  const columns = React.useMemo(
    () =>
      getBeneficiaryAssignmentColumns({
        onDelete: (assignmentId: string) => {
          setSelectedAssignmentId(assignmentId);
          setDeleteAssignmentDialogOpen(true);
        },
      }),
    []
  );

  // ============================================================================
  // LOADING & ERROR STATES
  // ============================================================================

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!will || !id) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <p className="text-lg text-muted-foreground">{t('wills:will_not_found')}</p>
        <Button onClick={() => navigate('/wills')}>
          {t('wills:back_to_wills')}
        </Button>
      </div>
    );
  }

  const statusInfo = getStatusInfo(will.status);
  const assignments = will.beneficiaryAssignments || [];

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/wills')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('wills:back_to_wills')}
        </Button>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{will.title}</h1>
              <Badge variant={statusInfo.variant} className={statusInfo.color}>
                {statusInfo.label}
              </Badge>
            </div>
            <p className="mt-2 text-muted-foreground">
              {t('wills:created_on')} {format(new Date(will.createdAt), 'PPP')}
            </p>
          </div>

          <Button onClick={() => setEditDialogOpen(true)} className="gap-2">
            <Edit className="h-4 w-4" />
            {t('wills:edit_will')}
          </Button>
        </div>
      </div>

      {/* Will Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t('wills:will_information')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {t('wills:will_title')}
              </p>
              <p className="mt-1">{will.title}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {t('wills:status')}
              </p>
              <p className="mt-1">{statusInfo.label}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {t('wills:created_on')}
              </p>
              <p className="mt-1">{format(new Date(will.createdAt), 'PPP')}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {t('wills:last_updated')}
              </p>
              <p className="mt-1">{format(new Date(will.updatedAt), 'PPP')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Beneficiary Assignments */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {t('wills:beneficiary_assignments')}
              </CardTitle>
              <CardDescription className="mt-1">
                {t('wills:beneficiary_assignments_description')}
              </CardDescription>
            </div>
            <Button onClick={() => setAssignDialogOpen(true)} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              {t('wills:assign_beneficiary')}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {assignments.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Users className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <p className="text-lg font-medium">{t('wills:no_assignments')}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t('wills:no_assignments_description')}
              </p>
              <Button 
                onClick={() => setAssignDialogOpen(true)} 
                className="mt-4 gap-2"
                variant="outline"
              >
                <Plus className="h-4 w-4" />
                {t('wills:assign_first_beneficiary')}
              </Button>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={assignments}
              isLoading={false}
            />
          )}
        </CardContent>
      </Card>

      {/* Edit Will Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('wills:edit_will')}</DialogTitle>
            <DialogDescription>
              {t('wills:edit_will_description')}
            </DialogDescription>
          </DialogHeader>
          <WillForm
            will={will}
            onSuccess={() => setEditDialogOpen(false)}
            onCancel={() => setEditDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Assign Beneficiary Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('wills:assign_beneficiary')}</DialogTitle>
            <DialogDescription>
              {t('wills:assign_beneficiary_description')}
            </DialogDescription>
          </DialogHeader>
          <BeneficiaryAssignmentForm
            willId={will.id}
            onSuccess={() => setAssignDialogOpen(false)}
            onCancel={() => setAssignDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Assignment Confirmation */}
      <ConfirmDialog
        open={deleteAssignmentDialogOpen}
        onOpenChange={setDeleteAssignmentDialogOpen}
        title={t('wills:confirm_remove_assignment_title')}
        description={t('wills:confirm_remove_assignment_message')}
        onConfirm={handleRemoveAssignment}
        variant="destructive"
        confirmText={t('common:remove')}
        cancelText={t('common:cancel')}
        isLoading={removeAssignmentMutation.isPending}
      />
    </div>
  );
}