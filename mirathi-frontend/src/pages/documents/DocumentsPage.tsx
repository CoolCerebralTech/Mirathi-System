import React, { useState } from 'react';
import { Plus } from 'lucide-react';

import { 
  PageHeader, 
  SearchBar 
} from '../../components/common';
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
  Label
} from '../../components/ui';

// Feature Components
import { 
  DocumentVaultGrid, 
  DocumentCategoryFilter, 
  SmartUploader, 
  DocumentPreviewDialog, 
  DocumentVersionSheet 
} from '../../features/documents/components';

import { 
  DocumentCategoryEnum, 
  type Document, 
  type DocumentCategory 
} from '../../types/document.types';

export const DocumentsPage: React.FC = () => {
  // --------------------------------------------------------------------------
  // State
  // --------------------------------------------------------------------------

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory | null>(null);

  // Modal States
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isVersionsOpen, setIsVersionsOpen] = useState(false);
  
  // Selection State
  const [activeDocument, setActiveDocument] = useState<Document | null>(null);
  
  // Upload Configuration State
  const [uploadCategory, setUploadCategory] = useState<DocumentCategory>(DocumentCategoryEnum.enum.OTHER);

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
    // The query invalidation happens inside the SmartUploader hook
  };

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

  return (
    <div className="flex flex-col gap-6 p-6">
      
      {/* 1. Header & Actions */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <PageHeader 
          title="Digital Vault" 
          description="Securely store, manage, and verify your legal estate documents."
        />
        
        <div className="flex items-center gap-2">
          <Button onClick={() => setIsUploadOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Upload Document
          </Button>
        </div>
      </div>

      {/* 2. Toolbar (Search & Filter) */}
      <div className="flex flex-col gap-4 border-b pb-6">
        <div className="w-full md:max-w-md">
            <SearchBar 
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search by file name..." 
                onSearch={setSearchQuery} 
            />
        </div>
        
        <DocumentCategoryFilter 
          selectedCategory={selectedCategory} 
          onSelect={setSelectedCategory} 
        />
      </div>

      {/* 3. Main Content Grid */}
      <DocumentVaultGrid 
        category={selectedCategory || undefined}
        searchQuery={searchQuery}
        onPreview={handlePreview}
        onViewVersions={handleVersions}
        className="min-h-[500px]"
      />

      {/* ------------------------------------------------------------------ */}
      {/* Dialogs & Modals */}
      {/* ------------------------------------------------------------------ */}

      {/* A. Upload Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload to Vault</DialogTitle>
            <DialogDescription>
              Add a new document to your permanent record.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Category Selector for General Uploads */}
            <div className="flex flex-col gap-2">
                <Label>Document Category</Label>
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
                                {cat.replace(/_/g, ' ')}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* The Smart Component */}
            <SmartUploader 
              category={uploadCategory}
              onUploadComplete={handleUploadComplete}
              label="Select File"
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

    </div>
  );
};
