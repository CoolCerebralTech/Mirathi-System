import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, AlertTriangle, Baby, Share2, Plus } from 'lucide-react';

import { useAuthStore } from '../../store/auth.store';
import { useFamilyDashboard } from '../../features/family/family.api';
import { CreateFamilyForm } from '../../features/family/components/CreateFamilyForm';
import { FamilyTree } from '../../features/family/components/FamilyTree'; // Assumes you have the graph/list component
import { AddMemberDialog } from '../../features/family/components/AddMemberDialog';

import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/Tabs';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export function FamilyDashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  
  // We assume the user's ID lets us find their family, or we fetch a list
  // For this implementation, we try to fetch the primary family linked to the user
  const { data: family, isLoading, isError } = useFamilyDashboard(user?.id || ''); 

  // STATE: If no family found, show creation mode
  const [isCreating, setIsCreating] = React.useState(false);

  if (isLoading) return <div className="h-96 flex items-center justify-center"><LoadingSpinner size="lg" /></div>;

  // Scenario 1: No Family Tree Found -> Prompt Creation
  if (isError || !family) {
    return (
      <div className="container max-w-3xl py-10">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Welcome to Mirathi Family</h1>
          <p className="text-muted-foreground mt-2">
            To start securing your legacy and succession plan, we first need to map your family tree.
          </p>
        </div>
        <Card className="border-dashed border-2">
          <CardContent className="pt-6">
            <CreateFamilyForm onSuccess={(id) => navigate(0)} /> 
          </CardContent>
        </Card>
      </div>
    );
  }

  // Scenario 2: Family Dashboard
  return (
    <div className="space-y-8 p-6">
      {/* Header Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{family.name}</h1>
          <p className="text-muted-foreground">
            {family.county} • {family.stats.totalMembers} Members • {family.structure.type.replace('_', ' ')}
          </p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" onClick={() => navigate(`/dashboard/family/${family.familyId}/polygamy`)}>
             <Share2 className="mr-2 h-4 w-4" /> Section 40 Analysis
           </Button>
           <AddMemberDialog familyId={family.familyId} />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{family.stats.verifiedMembers}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((family.stats.verifiedMembers / family.stats.totalMembers) * 100)}% Identity Confidence
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Potential Dependents</CardTitle>
            <Baby className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{family.stats.potentialDependents}</div>
            <p className="text-xs text-muted-foreground">Minors & Students (S.29)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
             <CardTitle className="text-sm font-medium">Readiness Score</CardTitle>
             <AlertTriangle className={`h-4 w-4 ${family.completeness.score < 80 ? 'text-amber-500' : 'text-green-500'}`} />
          </CardHeader>
          <CardContent>
             <div className="text-2xl font-bold">{family.completeness.score}%</div>
             <p className="text-xs text-muted-foreground">Succession Compliance</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <Tabs defaultValue="tree" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tree">Family Tree</TabsTrigger>
          <TabsTrigger value="list">Member List</TabsTrigger>
          <TabsTrigger value="issues">
             Missing Data 
             {family.completeness.missingFieldsCount > 0 && (
               <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-600">
                 {family.completeness.missingFieldsCount}
               </span>
             )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="tree" className="space-y-4">
           {/* The Visual Graph Component */}
           <FamilyTree /> 
        </TabsContent>
        
        <TabsContent value="list">
          <Card>
            <CardContent className="pt-6">
               <p className="text-muted-foreground">List view implementation here...</p>
               {/* Iterate over members and use FamilyMemberCard here */}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}