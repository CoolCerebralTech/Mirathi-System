// FILE: src/pages/family/FamilyListPage.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users } from 'lucide-react';

import {
  PageHeader,
  SearchBar,
  EmptyState,
  LoadingSpinner
} from '../../components/common';
import {
  Button,
  Dialog,
  DialogContent,
  Card
} from '../../components/ui';

import { CreateFamilyForm } from '../../features/family/components';
import { useSearchFamilies } from '../../features/family/family.api';

export const FamilyListPage: React.FC = () => {
  const navigate = useNavigate();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // API Call
  const { data, isLoading } = useSearchFamilies({
    search: searchQuery,
    page: 1,
    pageSize: 20,
  });

  const handleCreateSuccess = (familyId: string) => {
    setIsCreateOpen(false);
    navigate(`/dashboard/family/${familyId}`);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      
      {/* 1. Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <PageHeader 
          title="Family Estates" 
          description="Manage succession cases, intake new families, and track lineage."
        />
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Intake
        </Button>
      </div>

      {/* 2. Search */}
      <div className="w-full md:max-w-md">
        <SearchBar 
          value={searchQuery}
          // FIX: The SearchBar component passes the string directly.
          // We connect it directly to the state setter.
          onChange={setSearchQuery} 
          placeholder="Search by deceased name or file number..." 
          onSearch={setSearchQuery} 
        />
      </div>

      {/* 3. Content */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner text="Loading estates..." />
        </div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No families found"
          description="Start a new intake to begin the succession process."
          action={{
            label: "Start Intake",
            onClick: () => setIsCreateOpen(true),
          }}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.items.map((family) => (
            <Card 
              key={family.id} 
              className="cursor-pointer transition-all hover:border-primary/50 hover:shadow-md"
              onClick={() => navigate(`/dashboard/family/${family.id}`)}
            >
              <div className="flex flex-col gap-3 p-6">
                <div className="flex items-start justify-between">
                  <div className="rounded-full bg-primary/10 p-2 text-primary">
                    <Users className="h-5 w-5" />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Created {new Date(family.createdAt).toLocaleDateString()}
                  </span>
                </div>
                
                <div>
                  <h3 className="font-semibold text-lg line-clamp-1">{family.name}</h3>
                  <p className="text-sm text-muted-foreground">{family.county}</p>
                </div>

                <div className="mt-2 flex items-center justify-between border-t pt-4 text-sm">
                  <span className="text-muted-foreground">Members</span>
                  <span className="font-medium bg-slate-100 px-2 py-0.5 rounded-full text-xs">
                    {family.memberCount}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* 4. Create Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <CreateFamilyForm onSuccess={handleCreateSuccess} />
        </DialogContent>
      </Dialog>
    </div>
  );
};