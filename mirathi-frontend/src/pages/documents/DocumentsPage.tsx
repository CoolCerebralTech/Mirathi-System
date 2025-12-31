// FILE: src/pages/documents/DocumentsPage.tsx

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  FolderOpen, 
  ShieldCheck, 
  AlertTriangle,
  FileQuestion,
  Upload
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

import { 
  PageHeader, 
  SearchBar} from '../../components/common';
import { 
  Button, 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Label,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Card,
  CardContent,
  Badge,
  Alert,
  AlertDescription,
  AlertTitle
} from '../../components/ui';

// Feature Components
import { 
  DocumentVaultGrid, 
  DocumentCategoryFilter, 
  SmartUploader, 
  DocumentPreviewDialog, 
  DocumentVersionSheet} from '../../features/documents/components';

import { 
  DocumentCategoryEnum, 
  type Document, 
  type DocumentCategory 
} from '../../types/document.types';
type TabValue = 'all' | 'critical' | 'pending' | 'verified';

// Mock estate context - In real app, this would come from estate service
const MOCK_ESTATE = {
  id: 'estate-123',
  name: "John Kamau's Estate",
  deceasedName: "John Kamau",
  status: 'ACTIVE'
};

// Critical documents for succession process
const CRITICAL_DOCUMENTS = [
  {
    label: 'Death Certificate',
    category: DocumentCategoryEnum.enum.SUCCESSION_DOCUMENT,
    description: 'Required to prove death and initiate succession',
    required: true
  },
  {
    label: 'Deceased National ID',
    category: DocumentCategoryEnum.enum.IDENTITY_PROOF,
    description: 'Identity proof of the deceased',
    required: true
  },
  {
    label: 'Title Deeds',
    category: DocumentCategoryEnum.enum.LAND_OWNERSHIP,
    description: 'Proof of land and property ownership',
    required: true
  },
  {
    label: 'Will (if exists)',
    category: DocumentCategoryEnum.enum.SUCCESSION_DOCUMENT,
    description: 'Testamentary document for testate succession',
    required: false
  }
];

export const DocumentsPage: React.FC = () => {
  // --------------------------------------------------------------------------
  // State & URL Params
  // --------------------------------------------------------------------------
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Filter & Search
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory | null>(
    searchParams.get('category') as DocumentCategory || null
  );
  const [activeTab, setActiveTab] = useState<TabValue>('all');

  // Modal States
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isVersionsOpen, setIsVersionsOpen] = useState(false);
  
  // Selection State
  const [activeDocument, setActiveDocument] = useState<Document | null>(null);
  
  // Upload Configuration State
  const [uploadCategory, setUploadCategory] = useState<DocumentCategory>(
    (searchParams.get('uploadCategory') as DocumentCategory) || DocumentCategoryEnum.enum.OTHER
  );
  const [uploadIsCritical, setUploadIsCritical] = useState(false);

  // --------------------------------------------------------------------------
  // Effects for URL Sync
  // --------------------------------------------------------------------------
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (selectedCategory) params.set('category', selectedCategory);
    if (uploadCategory !== DocumentCategoryEnum.enum.OTHER) {
      params.set('uploadCategory', uploadCategory);
    }
    setSearchParams(params);
  }, [searchQuery, selectedCategory, uploadCategory, setSearchParams]);

  // --------------------------------------------------------------------------
  // Handlers
  // --------------------------------------------------------------------------
  const handlePreview = (doc: Document) => {
    setActiveDocument(doc);
    setIsPreviewOpen(true);
  };

  const handleVersions = (doc: Document) => {
    setActiveDocument(doc);
    setIsVersionsOpen(true);
  };

  const handleUploadComplete = () => {
    setIsUploadOpen(false);
    // Reset critical flag
    setUploadIsCritical(false);
    // The query invalidation happens inside the SmartUploader hook
  };

  const handleQuickUpload = (category: DocumentCategory, isCritical: boolean = false) => {
    setUploadCategory(category);
    setUploadIsCritical(isCritical);
    setIsUploadOpen(true);
  };

  // Calculate document statistics
  const getDocumentStats = () => {
    // In a real app, these would come from analytics API
    return {
      total: 12,
      verified: 8,
      pending: 3,
      rejected: 1,
      criticalMissing: 2
    };
  };

  const stats = getDocumentStats();

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

  return (
    <div className="flex flex-col gap-6 p-6">
      
      {/* 1. Header & Actions */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex-1">
          <PageHeader 
            title="Document Vault" 
            description="Securely store, manage, and verify all documents for the succession case."
            icon={FolderOpen}
          />
          
          {/* Estate Context Banner */}
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              Estate: {MOCK_ESTATE.deceasedName}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {MOCK_ESTATE.status}
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsUploadOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Upload Document
          </Button>
          <Button onClick={() => setIsUploadOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Document
          </Button>
        </div>
      </div>

      {/* 2. Succession Status & Alerts */}
      {stats.criticalMissing > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Critical Documents Missing</AlertTitle>
          <AlertDescription>
            You need {stats.criticalMissing} critical document(s) to proceed with succession.
            <Button 
              variant="link" 
              className="ml-2 h-auto p-0 text-white underline"
              onClick={() => setActiveTab('critical')}
            >
              View requirements
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* 3. Document Statistics */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-sm text-muted-foreground">Total Documents</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="text-2xl font-bold text-green-600">{stats.verified}</div>
              <p className="text-sm text-muted-foreground">Verified</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
              <p className="text-sm text-muted-foreground">Pending Review</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
              <p className="text-sm text-muted-foreground">Rejected</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 4. Main Content Area with Tabs */}
      <Tabs 
          defaultValue="all" 
          value={activeTab} 
          onValueChange={(v: string) => setActiveTab(v as TabValue)}
        >
          <div className="flex flex-col gap-4 border-b pb-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <TabsList>
                <TabsTrigger value="all">All Documents</TabsTrigger>
                <TabsTrigger value="critical">
                  Critical Documents
                  {stats.criticalMissing > 0 && (
                    <Badge variant="destructive" className="ml-2 px-1 py-0 text-[10px]">
                      {stats.criticalMissing} missing
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="pending">Pending Review</TabsTrigger>
                <TabsTrigger value="verified">Verified</TabsTrigger>
              </TabsList>
            
            <div className="w-full md:max-w-md">
              <SearchBar 
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search by file name, document number..." 
                onSearch={setSearchQuery}
              />
            </div>
          </div>
          
          <DocumentCategoryFilter 
            selectedCategory={selectedCategory} 
            onSelect={setSelectedCategory} 
          />
        </div>

        {/* Tab Contents */}
        <TabsContent value="all" className="mt-6">
          <DocumentVaultGrid 
            category={selectedCategory || undefined}
            searchQuery={searchQuery}
            onPreview={handlePreview}
            onViewVersions={handleVersions}
            className="min-h-[500px]"
          />
        </TabsContent>

        <TabsContent value="critical" className="mt-6">
          {/* Critical Documents Requirements */}
          <div className="mb-6 rounded-lg border bg-amber-50/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="h-5 w-5 text-amber-600" />
              <h3 className="text-sm font-medium text-amber-900">Succession Requirements</h3>
            </div>
            <p className="text-sm text-amber-800">
              These documents are required by Kenyan law to process the succession case.
              All critical documents must be verified before you can file with the court.
            </p>
          </div>

          <div className="grid gap-4 mb-8">
            {CRITICAL_DOCUMENTS.map((doc, index) => (
              <Card key={index} className={doc.required ? 'border-amber-200 bg-amber-50/30' : ''}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{doc.label}</h4>
                        {doc.required && (
                          <Badge variant="destructive" className="text-xs">
                            Required
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{doc.description}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickUpload(doc.category, doc.required)}
                    >
                      <Upload className="mr-2 h-3 w-3" />
                      Upload
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Already uploaded critical documents */}
          <h3 className="mb-4 text-lg font-medium">Uploaded Critical Documents</h3>
          <DocumentVaultGrid 
            category={selectedCategory || undefined}
            searchQuery={searchQuery}
            onPreview={handlePreview}
            onViewVersions={handleVersions}
            className="min-h-[300px]"
          />
        </TabsContent>

        <TabsContent value="pending" className="mt-6">
          <DocumentVaultGrid 
            category={selectedCategory || undefined}
            searchQuery={searchQuery}
            onPreview={handlePreview}
            onViewVersions={handleVersions}
            className="min-h-[400px]"
          />
        </TabsContent>

        <TabsContent value="verified" className="mt-6">
          <DocumentVaultGrid 
            category={selectedCategory || undefined}
            searchQuery={searchQuery}
            onPreview={handlePreview}
            onViewVersions={handleVersions}
            className="min-h-[400px]"
          />
        </TabsContent>
      </Tabs>

      {/* ------------------------------------------------------------------ */}
      {/* Dialogs & Modals */}
      {/* ------------------------------------------------------------------ */}

      {/* A. Upload Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Document to Vault</DialogTitle>
            <DialogDescription>
              Securely add documents to {MOCK_ESTATE.deceasedName}'s estate record.
              All documents are encrypted and stored permanently.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Quick Upload Suggestions */}
            <div className="rounded-lg border bg-muted/50 p-3">
              <p className="text-xs font-medium mb-2">Quick Upload:</p>
              <div className="flex flex-wrap gap-2">
                {Object.values(DocumentCategoryEnum.enum).slice(0, 3).map((cat) => (
                  <Button
                    key={cat}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => setUploadCategory(cat)}
                  >
                    {cat.replace(/_/g, ' ')}
                  </Button>
                ))}
              </div>
            </div>

            {/* Category Selector */}
            <div className="flex flex-col gap-2">
              <Label>Document Category *</Label>
              <Select 
                value={uploadCategory} 
                onValueChange={(val) => setUploadCategory(val as DocumentCategory)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(DocumentCategoryEnum.enum).map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      <div className="flex items-center gap-2">
                        <span>{cat.replace(/_/g, ' ')}</span>
                        {CRITICAL_DOCUMENTS.some(d => d.category === cat && d.required) && (
                          <Badge variant="destructive" className="text-[10px]">
                            Required
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {uploadCategory === DocumentCategoryEnum.enum.IDENTITY_PROOF && 
                  'For ID cards, passports, birth certificates'}
                {uploadCategory === DocumentCategoryEnum.enum.LAND_OWNERSHIP && 
                  'For title deeds, leases, survey plans'}
                {uploadCategory === DocumentCategoryEnum.enum.SUCCESSION_DOCUMENT && 
                  'For death certificates, grants, court orders'}
                {uploadCategory === DocumentCategoryEnum.enum.FINANCIAL_PROOF && 
                  'For bank statements, share certificates'}
              </p>
            </div>

            {/* Critical Document Toggle */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="critical"
                checked={uploadIsCritical}
                onChange={(e) => setUploadIsCritical(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="critical" className="text-sm">
                This is a critical document for succession
              </Label>
            </div>
            {uploadIsCritical && (
              <div className="rounded-lg bg-amber-50 p-3 border border-amber-200">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">Critical Document</p>
                    <p className="text-xs text-amber-700">
                      This document is required by Kenyan law to process the succession case.
                      It will be prioritized for verification.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* The Smart Component */}
            <SmartUploader 
              category={uploadCategory}
              onUploadComplete={handleUploadComplete}
              label="Select File"
              estateId={MOCK_ESTATE.id}
              isCritical={uploadIsCritical}
              description={`Upload ${uploadCategory.replace(/_/g, ' ').toLowerCase()} document`}
              className="mt-2"
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* B. Preview Dialog */}
      <DocumentPreviewDialog 
        document={activeDocument}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
      />

      {/* C. Version History Sheet */}
      <DocumentVersionSheet 
        document={activeDocument}
        isOpen={isVersionsOpen}
        onClose={() => setIsVersionsOpen(false)}
      />

      {/* D. Succession Context Footer */}
      <div className="mt-8 border-t pt-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h4 className="font-medium">Need help with succession documents?</h4>
            <p className="text-sm text-muted-foreground">
              Kenyan law requires specific documents for estate administration.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <FileQuestion className="mr-2 h-4 w-4" />
              View Requirements
            </Button>
            <Button size="sm">
              <ShieldCheck className="mr-2 h-4 w-4" />
              Check Readiness
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};