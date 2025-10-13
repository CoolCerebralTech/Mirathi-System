// FILE: src/features/admin/pages/AdminTemplatesPage.tsx (Finalized)

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, Plus } from 'lucide-react';

import { PageHeader } from '../../../components/common/PageHeader';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent } from '../../../components/ui/Card';
import { TemplatesTable } from '../components/TemplatesTable';
import { TemplateFormDialog } from '../components/TemplateFormDialog';
import { Template } from '../../../types/schemas/templates.schemas'; // UPGRADE: Correct import

export function AdminTemplatesPage() {
  const { t } = useTranslation(['admin', 'common']);

  const [filters, setFilters] = React.useState({ page: 1, limit: 10 });
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [selectedTemplate, setSelectedTemplate] = React.useState<Template | null>(null);

  const handlePaginationChange = (updater: any) => { /* ... implementation ... */ };
  
  const handleOpenCreate = () => {
    setSelectedTemplate(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (template: Template) => {
    setSelectedTemplate(template);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t('admin:templates_page_title')} description={t('admin:templates_page_subtitle')} icon={<Bell />}>
        <Button onClick={handleOpenCreate}><Plus className="mr-2 h-4 w-4" />{t('admin:create_template')}</Button>
      </PageHeader>
      <Card>
        <CardContent className="p-0">
          <TemplatesTable filters={filters} onPaginationChange={handlePaginationChange} onEdit={handleOpenEdit} />
        </CardContent>
      </Card>
      <TemplateFormDialog open={isFormOpen} onOpenChange={setIsFormOpen} template={selectedTemplate} />
    </div>
  );
}