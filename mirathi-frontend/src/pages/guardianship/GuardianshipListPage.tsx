import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users } from 'lucide-react';
import { PageHeader, SearchBar, EmptyState, LoadingSpinner } from '../../components/common';
import { Button, Dialog, DialogContent, Card } from '../../components/ui';
import { CreateGuardianshipForm, RiskLevelBadge } from '../../features/guardianship/components';
import { useSearchGuardianships } from '../../features/guardianship/guardianship.api';

export const GuardianshipListPage: React.FC = () => {
  const navigate = useNavigate();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  const { data, isLoading } = useSearchGuardianships({ page: 1, pageSize: 20, wardName: search });

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
         <PageHeader title="Guardianship Cases" description="Manage minors and protected persons." />
         <Button onClick={() => setIsCreateOpen(true)}><Plus className="mr-2 h-4 w-4" /> New Case</Button>
      </div>

      <SearchBar 
        value={search} 
        onChange={setSearch} 
        onSearch={setSearch} 
        placeholder="Search by Ward Name or Case Number..." 
      />

      {isLoading ? <LoadingSpinner /> : !data?.items.length ? (
         <EmptyState 
            icon={Users} 
            title="No Active Cases" 
            description="Start a new guardianship case." 
            action={{
                label: "Create Case",
                onClick: () => setIsCreateOpen(true)
            }} 
         />
      ) : (
         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.items.map(item => (
                <Card key={item.id} className="cursor-pointer hover:shadow-md transition-all p-5 space-y-4" onClick={() => navigate(`/dashboard/guardianship/${item.id}`)}>
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-bold text-lg">{item.wardName}</h3>
                            <p className="text-xs text-muted-foreground">Case #{item.caseNumber}</p>
                        </div>
                        <RiskLevelBadge level={item.riskLevel} />
                    </div>
                    <div className="text-sm">
                        <p className="text-muted-foreground">Guardian: <span className="text-foreground font-medium">{item.primaryGuardianName}</span></p>
                        <p className="text-muted-foreground">Next Report: <span className="text-foreground">{new Date(item.nextComplianceDue).toLocaleDateString()}</span></p>
                    </div>
                </Card>
            ))}
         </div>
      )}

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
         <DialogContent>
            <CreateGuardianshipForm onSuccess={() => setIsCreateOpen(false)} />
         </DialogContent>
      </Dialog>
    </div>
  );
};