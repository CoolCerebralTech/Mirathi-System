import React, { useState } from 'react';
import { FileText, AlertCircle } from 'lucide-react';
import { 
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Alert,
  AlertDescription,
  Skeleton
} from '@/components/ui';
import { useWillPreview } from '@/api/estate/estate.api';
import { BeneficiaryList } from './BeneficiaryList';
import { WitnessList } from './WitnessList';
import { WillStatusCard } from './WillStatusCard';
import { WillPreviewDialog } from './WillPreviewDialog';

interface WillBuilderProps {
  willId: string;
  testatorName: string;
}

export const WillBuilder: React.FC<WillBuilderProps> = ({ 
  willId, 
  testatorName 
}) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('status');

  const { data: willPreview, isLoading, isError, error } = useWillPreview(willId);

  // Loading State
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-64 w-full" />
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  // Error State
  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load will details: {error?.message || 'Unknown error occurred'}
        </AlertDescription>
      </Alert>
    );
  }

  if (!willPreview) {
    return (
      <Alert>
        <FileText className="h-4 w-4" />
        <AlertDescription>
          No will data available. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    );
  }

  // Extract beneficiaries and witnesses from the preview
  // Note: You might need to fetch these separately if they're not in the preview
  // For now, we'll use empty arrays as placeholders
  const beneficiaries = willPreview.metadata.willId ? [] : [];
  const witnesses = willPreview.metadata.willId ? [] : [];

  return (
    <div className="space-y-6">
      {/* Will Status Card */}
      <WillStatusCard 
        data={willPreview}
        onPreview={() => setIsPreviewOpen(true)}
      />

      {/* Tabbed Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="status">Overview</TabsTrigger>
          <TabsTrigger value="beneficiaries">
            Beneficiaries
            {beneficiaries.length > 0 && (
              <span className="ml-2 bg-primary/20 text-primary px-2 py-0.5 rounded-full text-xs">
                {beneficiaries.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="witnesses">
            Witnesses
            {witnesses.length > 0 && (
              <span className="ml-2 bg-primary/20 text-primary px-2 py-0.5 rounded-full text-xs">
                {witnesses.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="status" className="space-y-4">
          <div className="prose prose-sm max-w-none">
            <h3>Will Status Overview</h3>
            <p className="text-muted-foreground">
              This section shows the current status of your will and any required actions.
              Complete all sections to make your will legally valid.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Testator Information</h4>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Name:</dt>
                  <dd className="font-medium">{testatorName}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Will ID:</dt>
                  <dd className="font-mono text-xs">{willPreview.metadata.willId}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Status:</dt>
                  <dd className="font-medium">{willPreview.metadata.status}</dd>
                </div>
              </dl>
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Completion Checklist</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked disabled className="rounded" />
                  <span>Will created</span>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    checked={beneficiaries.length > 0} 
                    disabled 
                    className="rounded" 
                  />
                  <span>Beneficiaries added</span>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    checked={witnesses.length >= 2} 
                    disabled 
                    className="rounded" 
                  />
                  <span>2+ witnesses nominated</span>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    checked={willPreview.metadata.completenessScore === 100} 
                    disabled 
                    className="rounded" 
                  />
                  <span>100% complete</span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Beneficiaries Tab */}
        <TabsContent value="beneficiaries" className="space-y-4">
          <BeneficiaryList 
            willId={willId}
            beneficiaries={beneficiaries}
          />
        </TabsContent>

        {/* Witnesses Tab */}
        <TabsContent value="witnesses" className="space-y-4">
          <WitnessList 
            willId={willId}
            witnesses={witnesses}
          />
        </TabsContent>
      </Tabs>

      {/* Preview Dialog */}
      <WillPreviewDialog
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        htmlContent={willPreview.htmlPreview}
        testatorName={testatorName}
      />
    </div>
  );
};