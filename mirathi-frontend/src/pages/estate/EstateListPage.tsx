import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Building2, 
  Calendar, 
  Search, 
  ArrowRight 
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

import { 
  Button, 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  Input 
} from '../../components/ui';
import { 
  PageHeader, 
  LoadingSpinner, 
  EmptyState 
} from '../../components/common';
import { EstateStatusBadge } from '../../features/estate/components/shared/EstateStatusBadge';
import { MoneyDisplay } from '../../features/estate/components/shared/MoneyDisplay';

// We use the query keys defined in your api file
import { estateKeys } from '../../features/estate/estate.api';
import { apiClient } from '../../api/client';
import { useQuery } from '@tanstack/react-query';
import { type EstateStatus } from '../../types/estate.types';

// Minimal interface for the list view
interface EstateSummary {
  id: string;
  name: string;
  deceasedName: string;
  dateOfDeath: string;
  status: EstateStatus;
  isFrozen: boolean;
  netWorth: { amount: number; currency: string };
  assetCount: number;
}

export const EstateListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch List
  const { data, isLoading } = useQuery({
    queryKey: estateKeys.all,
    queryFn: async () => {
      // Assuming GET /estate/estates returns the list
      const res = await apiClient.get<EstateSummary[]>('/estate/estates');
      return res.data;
    }
  });

  // Client-side filtering
  const filteredEstates = data?.filter(e => 
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.deceasedName.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="flex flex-col gap-6 p-6">
      
      {/* 1. Header & Actions */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <PageHeader 
          title="Estate Registry" 
          description="Manage assets, debts, and distribution for succession cases."
        />
        <Button onClick={() => navigate('/estates/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Create Estate
        </Button>
      </div>

      {/* 2. Search Toolbar */}
      <div className="flex w-full max-w-sm items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by estate or deceased name..." 
            className="pl-8" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* 3. Estate Grid */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner text="Loading estates..." />
        </div>
      ) : filteredEstates.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={searchQuery ? "No matching estates" : "No estates found"}
          description={searchQuery ? "Try adjusting your search terms." : "Start by creating a new estate record."}
          actionLabel={searchQuery ? undefined : "Create Estate"}
          onAction={searchQuery ? undefined : () => navigate('/estates/new')}
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredEstates.map((estate) => (
            <Card 
              key={estate.id} 
              className="group cursor-pointer transition-all hover:border-primary/50 hover:shadow-md"
              onClick={() => navigate(`/estates/${estate.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="rounded-lg bg-slate-100 p-2 text-slate-600 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <EstateStatusBadge status={estate.status} isFrozen={estate.isFrozen} />
                </div>
                <CardTitle className="mt-3 line-clamp-1 text-lg">
                  {estate.name}
                </CardTitle>
                <div className="text-sm text-muted-foreground">
                  Deceased: <span className="font-medium text-foreground">{estate.deceasedName}</span>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="flex flex-col gap-4">
                  {/* Stats Row */}
                  <div className="grid grid-cols-2 gap-4 rounded-lg border bg-slate-50 p-3">
                    <div>
                      <p className="text-[10px] font-medium uppercase text-muted-foreground">Net Worth</p>
                      <MoneyDisplay 
                        amount={estate.netWorth} 
                        className="text-sm font-bold text-slate-900" 
                      />
                    </div>
                    <div>
                      <p className="text-[10px] font-medium uppercase text-muted-foreground">Assets</p>
                      <p className="text-sm font-bold text-slate-900">{estate.assetCount} Items</p>
                    </div>
                  </div>

                  {/* Footer Info */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>Passed {formatDistanceToNow(new Date(estate.dateOfDeath), { addSuffix: true })}</span>
                    </div>
                    <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};