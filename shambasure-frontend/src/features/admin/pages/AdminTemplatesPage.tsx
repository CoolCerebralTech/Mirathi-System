// FILE: src/features/admin/pages/AdminTemplatesPage.tsx

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, Plus } from 'lucide-react';

import { Button } from '../../../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/Select';
import { TemplatesTable } from '../components/TemplatesTable';
import { TemplateFormDialog } from '../components/TemplateFormDialog';
import { TestTemplateDialog } from '../components/TestTemplateDialog';
import type { NotificationTemplate, TemplateQuery, NotificationChannel } from '../../../types';

// ============================================================================
// COMPONENT
// ============================================================================

export function AdminTemplatesPage() {
  const { t } = useTranslation(['admin', 'common']);

  const [filters, setFilters] = React.useState<TemplateQuery>({
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const [formDialogOpen, setFormDialogOpen] = React.useState(false);
  const [testDialogOpen, setTestDialogOpen] = React.useState(false);
  const [selectedTemplate, setSelectedTemplate] = React.useState<NotificationTemplate | null>(null);
  const [formMode, setFormMode] = React.useState<'create' | 'edit'>('create');

  const handleFiltersChange = (newFilters: TemplateQuery) => {
    setFilters(newFilters);
  };

  const handleChannelFilter = (value: string) => {
    setFilters({
      ...filters,
      channel: value === 'all' ? undefined : (value as NotificationChannel),
      page: 1,
    });
  };

  const handleCreateTemplate = () => {
    setSelectedTemplate(null);
    setFormMode('create');
    setFormDialogOpen(true);
  };

  const handleEditTemplate = (template: NotificationTemplate) => {
    setSelectedTemplate(template);
    setFormMode('edit');
    setFormDialogOpen(true);
  };

  const handleTestTemplate = (template: NotificationTemplate) => {
    setSelectedTemplate(template);
    setTestDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Bell className="h-8 w-8" />
            {t('admin:templates_page_title')}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {t('admin:templates_page_subtitle')}
          </p>
        </div>

        <Button onClick={handleCreateTemplate} className="gap-2">
          <Plus className="h-4 w-4" />
          {t('admin:create_template')}
        </Button>
      </div>

      {/* Filters Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('admin:filters')}</CardTitle>
          <CardDescription>
            {t('admin:filter_templates_description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Select
              value={filters.channel || 'all'}
              onValueChange={handleChannelFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('admin:all_channels')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('admin:all_channels')}</SelectItem>
                <SelectItem value="EMAIL">Email</SelectItem>
                <SelectItem value="SMS">SMS</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={String(filters.limit)}
              onValueChange={(value) => 
                setFilters({ ...filters, limit: Number(value), page: 1 })
              }
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 {t('admin:per_page')}</SelectItem>
                <SelectItem value="25">25 {t('admin:per_page')}</SelectItem>
                <SelectItem value="50">50 {t('admin:per_page')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Templates Table Card */}
      <Card>
        <CardContent className="p-0">
          <TemplatesTable
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onEditTemplate={handleEditTemplate}
            onTestTemplate={handleTestTemplate}
          />
        </CardContent>
      </Card>

      {/* Dialogs */}
      <TemplateFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        template={selectedTemplate}
        mode={formMode}
      />

      <TestTemplateDialog
        open={testDialogOpen}
        onOpenChange={setTestDialogOpen}
        template={selectedTemplate}
      />
    </div>
  );
}