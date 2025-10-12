// FILE: src/pages/FamiliesPage.tsx

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Eye } from 'lucide-react';

import { useFamilies } from '../features/families/families.api';
import { FamilyForm } from '../features/families/components/FamilyForm';

import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/Dialog';
import { Badge } from '../components/ui/Badge';

// ============================================================================
// COMPONENT
// ============================================================================

export function FamiliesPage() {
  const { t } = useTranslation(['families', 'common']);
  const navigate = useNavigate();

  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);

  // API Hooks
  const { data, isLoading } = useFamilies({ limit: 100 });

  const families = data?.data || [];

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-8 w-8" />
            {t('families:my_families')}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {t('families:my_families_subtitle')}
          </p>
        </div>

        <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          {t('families:create_family')}
        </Button>
      </div>

      {/* Families Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 w-3/4 bg-muted rounded mb-2" />
                <div className="h-4 w-1/2 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : families.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="mb-4 h-16 w-16 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold">{t('families:no_families')}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('families:no_families_description')}
            </p>
            <Button 
              onClick={() => setCreateDialogOpen(true)} 
              className="mt-4 gap-2"
            >
              <Plus className="h-4 w-4" />
              {t('families:create_first_family')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {families.map((family) => {
            const membersCount = family.members?.length || 0;
            
            return (
              <Card 
                key={family.id} 
                className="group cursor-pointer hover:shadow-lg transition-all"
                onClick={() => navigate(`/families/${family.id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{family.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {membersCount} {membersCount === 1 ? t('families:member') : t('families:members')}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/families/${family.id}`);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>

                  {family.members && family.members.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {family.members.slice(0, 3).map((member) => (
                        <Badge key={member.userId} variant="outline" className="text-xs">
                          {member.user?.firstName}
                        </Badge>
                      ))}
                      {family.members.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{family.members.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Family Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('families:create_family')}</DialogTitle>
            <DialogDescription>
              {t('families:create_family_description')}
            </DialogDescription>
          </DialogHeader>
          <FamilyForm
            onSuccess={() => setCreateDialogOpen(false)}
            onCancel={() => setCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}