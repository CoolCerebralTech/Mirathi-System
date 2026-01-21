// FILE: src/pages/family/FamilyDashboardPage.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Shield, 
  PieChart, 
  AlertTriangle, 
  Plus, 
  ArrowRight,
  FileText,
  Home,
  TreePine,
  Baby
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Alert,
  AlertDescription,
  AlertTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Skeleton,
} from '@/components/ui';

import {
  CreateFamilyDialog,
  HeirsOverview,
} from '@/features/family/components'; 

import { 
  useMyFamily, 
  useMyFamilyTree, 
  usePotentialHeirs 
} from '@/api/family/family.api';

import type { FamilyResponse } from '@/types/family.types';

// ============================================================================
// LOCAL TYPE EXTENSIONS
// ============================================================================
// We extend the base FamilyResponse to include computed fields that the 
// dashboard expects but might be missing from the strict strict base type.
interface DashboardFamilyData extends FamilyResponse {
  hasMissingLinks?: boolean;
  completenessScore?: number;
  lastActivityAt?: string;
  homeCounty?: string;
  tribe?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const FamilyDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [isCreateFamilyOpen, setIsCreateFamilyOpen] = useState(false);
  
  // 1. Fetch Data
  const { 
    data: rawFamily, 
    isLoading: isLoadingFamily, 
    error: familyError,
    refetch: refetchFamily 
  } = useMyFamily();
  
  // Safe Cast: Treat the response as our extended dashboard type
  const myFamily = rawFamily as unknown as DashboardFamilyData | undefined;

  const { 
    data: tree, 
    isLoading: isLoadingTree,
    error: treeError,
    refetch: refetchTree 
  } = useMyFamilyTree();
  
  const { 
    data: heirsData, 
    isLoading: isLoadingHeirs 
  } = usePotentialHeirs(myFamily?.id || '', {
    enabled: !!myFamily?.id
  });

  const handleRefresh = () => {
    refetchFamily();
    refetchTree();
  };

  // 2. Loading State
  if (isLoadingFamily || isLoadingTree) {
    return (
      <div className="container mx-auto p-6 space-y-6 animate-pulse">
        <div className="flex justify-between items-end">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-48 w-full rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // 3. Error State
  if (familyError || treeError) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Unable to Load Family Data</AlertTitle>
          <AlertDescription className="space-y-3 pt-2">
            <p className="text-sm">
              {familyError?.message || treeError?.message || 'We encountered an issue synchronizing your family data.'}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                Retry Connection
              </Button>
              <Button size="sm" onClick={() => navigate('/dashboard')}>
                Return to Dashboard
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // 4. Empty State (Onboarding)
  if (!myFamily) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Alert className="mb-8 bg-blue-50 border-blue-100">
          <AlertTitle className="text-blue-800 font-semibold flex items-center gap-2">
            <Home className="h-4 w-4" />
            Welcome to Family Planning
          </AlertTitle>
          <AlertDescription className="text-blue-700 mt-1">
            You are one step away from securing your legacy. Create a family tree to begin.
          </AlertDescription>
        </Alert>
        
        <div className="flex flex-col items-center justify-center min-h-[50vh] border-2 border-dashed border-slate-200 rounded-xl p-12 bg-slate-50/50 hover:bg-slate-50 transition-colors">
          <div className="h-20 w-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-6 ring-4 ring-slate-100">
             <TreePine className="h-10 w-10 text-primary" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-3">Start Your Family Tree</h3>
          <p className="text-slate-500 text-center mb-8 max-w-md leading-relaxed">
            Create your digital family profile to automatically generate succession plans, identify heirs, and manage guardianship for minors.
          </p>
          <Button 
            onClick={() => setIsCreateFamilyOpen(true)}
            size="lg"
            className="h-12 px-8 text-base shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="mr-2 h-5 w-5" />
            Create Family Tree
          </Button>
        </div>

        <CreateFamilyDialog
          isOpen={isCreateFamilyOpen}
          onClose={() => setIsCreateFamilyOpen(false)}
        />
      </div>
    );
  }

  // 5. Calculate Derived Stats (After we confirm myFamily exists)
  const totalMinors = tree?.children?.filter((child) => child.isMinor).length || 0;
  
  // Safe access using the extended type
  const hasMissingLinks = myFamily.hasMissingLinks || false;
  const completenessScore = myFamily.completenessScore || 0;
  const totalMembers = myFamily.totalMembers || 0;

  // 6. Main Dashboard Render
  return (
    <div className="container mx-auto p-4 md:p-6 space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="bg-primary/10 p-2.5 rounded-lg text-primary">
              <TreePine className="h-6 w-6" />
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Family Dashboard
            </h1>
          </div>
          <p className="text-slate-600 max-w-2xl pl-1">
            Managing succession planning and guardianship for the <strong>{myFamily.name}</strong>.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => navigate('/dashboard/family/tree')}
            className="shadow-sm"
          >
            <ArrowRight className="mr-2 h-4 w-4" />
            View Visual Tree
          </Button>
          <Button 
            onClick={() => navigate('/dashboard/family/tree?action=add')}
            className="shadow-sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Member
          </Button>
        </div>
      </div>

      {/* Main Info Card */}
      <Card className="bg-gradient-to-br from-white to-slate-50 border-slate-200 shadow-sm">
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                 <h2 className="text-2xl font-bold text-slate-800">{myFamily.name}</h2>
                 {myFamily.isPolygamous && (
                    <Badge variant="destructive" className="text-xs px-2 py-0.5">Polygamous Estate</Badge>
                 )}
              </div>
              
              {myFamily.description && (
                <p className="text-slate-500 max-w-xl text-sm leading-relaxed">{myFamily.description}</p>
              )}
              
              <div className="flex flex-wrap gap-2 pt-1">
                {myFamily.homeCounty && (
                  <Badge variant="outline" className="bg-white px-2 py-1 font-normal">
                    County: {myFamily.homeCounty.replace(/_/g, ' ')}
                  </Badge>
                )}
                {myFamily.tribe && (
                  <Badge variant="secondary" className="bg-slate-200 px-2 py-1 font-normal">
                    Tribe: {myFamily.tribe}
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center gap-8 md:border-l md:pl-8 border-slate-200">
              <div className="text-right">
                <div className="text-4xl font-bold text-slate-900 tracking-tight">{totalMembers}</div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Members</p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-emerald-600 tracking-tight">{completenessScore}%</div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Complete</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Members */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Members</CardTitle>
            <Users className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMembers}</div>
            <p className="text-xs text-slate-500 mt-1">
              {totalMinors > 0 ? `${totalMinors} minors recorded` : 'No minors recorded'}
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Health */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Tree Health</CardTitle>
            <PieChart className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
               {hasMissingLinks ? <span className="text-amber-600">Action Needed</span> : <span className="text-emerald-600">Healthy</span>}
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
              <div 
                className={`h-1.5 rounded-full transition-all duration-500 ${hasMissingLinks ? 'bg-amber-500' : 'bg-emerald-500'}`}
                style={{ width: `${completenessScore}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Guardianship */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Guardianship</CardTitle>
            <Shield className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalMinors > 0 ? (
                 <span className="text-amber-600">{totalMinors} Pending</span>
              ) : (
                 <span className="text-slate-400">N/A</span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {totalMinors > 0 ? 'Assignments required' : 'No minors in tree'}
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Last Update</CardTitle>
            <FileText className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold truncate">
              {myFamily.lastActivityAt 
                ? new Date(myFamily.lastActivityAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                : 'Just now'
              }
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Creation: {new Date(myFamily.createdAt).toLocaleDateString('en-GB')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="heirs" className="space-y-6">
        <TabsList className="w-full justify-start bg-slate-100 p-1 rounded-lg">
          <TabsTrigger value="heirs" className="flex-1 lg:flex-none px-6">Heirs Analysis</TabsTrigger>
          <TabsTrigger value="updates" className="flex-1 lg:flex-none px-6">Recent Updates</TabsTrigger>
          <TabsTrigger value="resources" className="flex-1 lg:flex-none px-6">Legal Resources</TabsTrigger>
        </TabsList>
        
        <TabsContent value="heirs" className="space-y-4 focus-visible:outline-none animate-in fade-in-50 slide-in-from-left-2">
          {isLoadingHeirs ? (
            <div className="space-y-3">
              <Skeleton className="h-48 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          ) : heirsData ? (
            <HeirsOverview familyId={myFamily.id} />
          ) : (
            <Alert className="bg-slate-50 border-slate-200">
              <AlertTriangle className="h-4 w-4 text-slate-400" />
              <AlertTitle>No Analysis Generated</AlertTitle>
              <AlertDescription>
                Add more family members to your tree to generate an automated heirs analysis report.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
        
        <TabsContent value="updates">
           <Card>
             <CardHeader>
               <CardTitle>Recent Activity Log</CardTitle>
               <CardDescription>Track changes made to your succession plan.</CardDescription>
             </CardHeader>
             <CardContent>
               <div className="text-sm text-slate-500 italic py-8 text-center border rounded-lg border-dashed">
                 No detailed activity logs available yet. Check back after editing your tree.
               </div>
             </CardContent>
           </Card>
        </TabsContent>
        
        <TabsContent value="resources">
          <Card>
            <CardHeader>
              <CardTitle>Legal Resources (Kenya)</CardTitle>
              <CardDescription>
                Essential documents for understanding succession and child protection laws.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="bg-blue-50 border-blue-100">
                <FileText className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-800 font-semibold">Legal Disclaimer</AlertTitle>
                <AlertDescription className="text-blue-700 text-sm mt-1">
                  Mirathi provides guidance based on the Law of Succession Act (Cap 160). 
                  This platform is a tool for planning, not a substitute for professional legal counsel.
                </AlertDescription>
              </Alert>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <Button variant="outline" className="h-auto py-4 justify-start group hover:border-primary hover:bg-primary/5" asChild>
                  <a href="http://kenyalaw.org/kl/fileadmin/pdfdownloads/Acts/LawsofSuccessionActCap160.pdf" target="_blank" rel="noopener noreferrer">
                    <FileText className="mr-3 h-5 w-5 text-slate-400 group-hover:text-primary" />
                    <div className="text-left">
                      <div className="font-semibold text-slate-900">Law of Succession Act</div>
                      <div className="text-xs text-slate-500">Cap 160 (PDF)</div>
                    </div>
                  </a>
                </Button>
                <Button variant="outline" className="h-auto py-4 justify-start group hover:border-primary hover:bg-primary/5" asChild>
                  <a href="http://kenyalaw.org/kl/fileadmin/pdfdownloads/Acts/ChildrenAct_Cap_141.pdf" target="_blank" rel="noopener noreferrer">
                    <Baby className="mr-3 h-5 w-5 text-slate-400 group-hover:text-primary" />
                    <div className="text-left">
                      <div className="font-semibold text-slate-900">Children Act</div>
                      <div className="text-xs text-slate-500">Cap 141 (PDF)</div>
                    </div>
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <CreateFamilyDialog
        isOpen={isCreateFamilyOpen}
        onClose={() => setIsCreateFamilyOpen(false)}
      />
    </div>
  );
};