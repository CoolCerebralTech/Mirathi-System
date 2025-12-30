import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FolderOpen, AlertCircle } from 'lucide-react';

import { useGuardianshipList } from '../../features/family/guardianship/guardianship.api';
import { CreateGuardianshipForm } from '../../features/family/guardianship/components/CreateGuardianshipForm';

import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Dialog, DialogContent, DialogTrigger } from '../../components/ui/Dialog';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export function GuardianshipListPage() {
  const navigate = useNavigate();
  // Fetch active cases
  const { data, isLoading } = useGuardianshipList({ page: 1 });

  return (
    <div className="space-y-8 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Guardianship & Minors</h1>
          <p className="text-muted-foreground">
            Manage legal authority, compliance reporting, and funds for minors.
          </p>
        </div>
        
        {/* We need a ward ID to open a file, usually from Family Tree. 
            Here we might show a selector or redirect to tree. 
            For demo, simplified Dialog Trigger. */}
        <Button onClick={() => navigate('/dashboard/family')}>
           <Plus className="mr-2 h-4 w-4" /> Open New File (From Family)
        </Button>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data?.items.map((item) => (
            <Card 
              key={item.id} 
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => navigate(`/dashboard/guardianship/${item.id}`)}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <Badge variant="outline">{item.caseNumber}</Badge>
                  <Badge className={
                    item.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                  }>
                    {item.status}
                  </Badge>
                </div>
                <CardTitle className="mt-2">{item.wardName}</CardTitle>
                <CardDescription>Ward Age: {item.wardAge} years</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Guardian:</span>
                    <span className="font-medium truncate max-w-[150px]">{item.primaryGuardianName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Next Report:</span>
                    <span className={new Date(item.nextComplianceDue) < new Date() ? 'text-red-500 font-bold' : ''}>
                      {new Date(item.nextComplianceDue).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {data?.items.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg bg-slate-50">
              <FolderOpen className="h-12 w-12 text-slate-300 mb-4" />
              <h3 className="text-lg font-medium">No Active Cases</h3>
              <p className="text-muted-foreground">Go to your Family Tree to appoint a guardian for a minor.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}