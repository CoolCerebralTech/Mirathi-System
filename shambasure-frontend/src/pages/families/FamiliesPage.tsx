// FILE: src/pages/dashboard/FamiliesPage.tsx (Finalized)

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Eye, AlertTriangle } from 'lucide-react';

import { useMyFamilies } from '../../features/families/families.api';
import { FamilyForm } from '../../features/families/components/FamilyForm';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/Dialog';
import { Badge } from '../../components/ui/Badge';

export function FamiliesPage() {
  const { t } = useTranslation(['families', 'common']);
  const navigate = useNavigate();

  const [isCreateOpen, setIsCreateOpen] = React.useState(false);

  // UPGRADE: The hook returns a flat array, not a paginated object.
  const { data: families, isLoading, isError } = useMyFamilies();

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6 h-36 bg-muted rounded-lg" />
            </Card>
          ))}
        </div>
      );
    }

    if (isError) {
       return (
        <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-destructive/50 bg-destructive/10 text-destructive">
          <AlertTriangle className="h-8 w-8" />
          <p className="mt-2 font-medium">{t('common:error_loading_data')}</p>
        </div>
      );
    }
    
    if (!families || families.length === 0) {
      return (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <Users className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">{t('families:no_families_title')}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{t('families:no_families_prompt')}</p>
          <Button onClick={() => setIsCreateOpen(true)} className="mt-6">
            <Plus className="mr-2 h-4 w-4" />
            {t('families:create_first_family')}
          </Button>
        </div>
      );
    }

    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {families.map((family) => {
          const membersCount = family.members?.length || 0;
          return (
            <Card
              key={family.id}
              className="group cursor-pointer hover:shadow-lg transition-all"
              onClick={() => navigate(`/dashboard/families/${family.id}`)} // UPGRADE: Corrected path
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{family.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {/* UPGRADE: Use i18next pluralization */}
                      {t('families:member_count', { count: membersCount })}
                    </p>
                  </div>
                  <Eye className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                {family.members && membersCount > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {family.members.slice(0, 4).map((member) => (
                      <Badge key={member.userId} variant="secondary">
                        {member.user.firstName}
                      </Badge>
                    ))}
                    {membersCount > 4 && <Badge variant="secondary">+{membersCount - 4} more</Badge>}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('families:my_families')}
        description={t('families:my_families_subtitle')}
      >
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('families:create_family')}
        </Button>
      </PageHeader>

      {renderContent()}

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('families:create_new_family')}</DialogTitle>
            <DialogDescription>{t('families:create_family_prompt')}</DialogDescription>
          </DialogHeader>
          <FamilyForm onSuccess={() => setIsCreateOpen(false)} onCancel={() => setIsCreateOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}