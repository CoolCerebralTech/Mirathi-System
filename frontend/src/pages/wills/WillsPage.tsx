// FILE: src/pages/WillsPage.tsx

import { Link, useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/common/PageHeader';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/Card';
import { PlusCircle, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { useMyWills, useCreateWill } from '../features/wills/wills.api';
import { Badge } from '../components/ui/Badge';
import { toast } from '../hooks/useToast';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export function WillsPage() {
  const navigate = useNavigate();
  const { data: wills, isLoading } = useMyWills();
  const createWillMutation = useCreateWill();

  const handleCreateWill = () => {
    // A simple default title for a new will.
    const defaultTitle = `Will - ${new Date().toLocaleDateString()}`;
    
    createWillMutation.mutate({ title: defaultTitle }, {
      onSuccess: (newWill) => {
        toast.success('New draft will created!');
        // Navigate the user directly to the detail page for the new will.
        navigate(`/wills/${newWill.id}`);
      },
      onError: (error: any) => {
        toast.error('Failed to create will', { description: error.message });
      }
    });
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
        case 'ACTIVE': return <CheckCircle className="h-4 w-4 text-green-500" />;
        case 'DRAFT': return <FileText className="h-4 w-4 text-yellow-500" />;
        default: return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Wills"
        description="Manage your last wills and testaments. You can have multiple drafts, but only one can be active."
        actions={
          <Button onClick={handleCreateWill} disabled={createWillMutation.isLoading}>
            <PlusCircle className="mr-2 h-4 w-4" />
            {createWillMutation.isLoading ? 'Creating...' : 'Create New Will'}
          </Button>
        }
      />

      {isLoading && (
        <div className="flex justify-center p-8">
            <LoadingSpinner size="lg" />
        </div>
      )}

      {!isLoading && !wills?.length && (
          <div className="text-center p-8 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground">You haven't created any wills yet.</p>
              <Button onClick={handleCreateWill} className="mt-4">Create Your First Will</Button>
          </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {wills?.map(will => (
          <Card key={will.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{will.title}</CardTitle>
                  <Badge variant={will.status === 'ACTIVE' ? 'default' : 'secondary'}>
                      {will.status}
                  </Badge>
              </div>
              <CardDescription>
                Last updated: {new Date(will.updatedAt).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                {getStatusIcon(will.status)}
                <span className="text-sm text-muted-foreground">
                    {will.beneficiaryAssignments.length} asset(s) assigned.
                </span>
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link to={`/wills/${will.id}`}>View & Edit</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}