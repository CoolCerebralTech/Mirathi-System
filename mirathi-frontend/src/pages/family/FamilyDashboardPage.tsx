// src/pages/family/FamilyDashboardPage.tsx
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
  Baby,
  Home,
  TreePine
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
  Separator,
} from '@/components/ui';
import {
  CreateFamilyDialog,
  HeirsOverview,
} from '@/features/family/components';
import { 
  useMyFamily, 
  useMyFamilyTree, 
  usePotentialHeirs 
} from '@/features/family/family.api';

export const FamilyDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [isCreateFamilyOpen, setIsCreateFamilyOpen] = useState(false);
  
  // Fetch family data
  const { 
    data: myFamily, 
    isLoading: isLoadingFamily, 
    error: familyError,
    refetch: refetchFamily 
  } = useMyFamily();
  
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

  // Calculate stats
  const totalMinors = tree?.children?.filter(child => child.isMinor).length || 0;
  const hasMissingLinks = myFamily?.hasMissingLinks || false;
  const completenessScore = myFamily?.completenessScore || 0;
  const totalMembers = myFamily?.totalMembers || 0;

  const handleRefresh = () => {
    refetchFamily();
    refetchTree();
  };

  // Loading state
  if (isLoadingFamily || isLoadingTree) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (familyError || treeError) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Failed to Load Family Data</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>{familyError?.message || treeError?.message || 'Unknown error'}</p>
            <div className="flex gap-2 mt-2">
              <Button variant="outline" onClick={handleRefresh}>
                Retry
              </Button>
              <Button onClick={() => navigate('/dashboard')}>
                Go to Main Dashboard
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Empty state - no family created
  if (!myFamily) {
    return (
      <div className="container mx-auto p-6">
        <Alert className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>No Family Tree Found</AlertTitle>
          <AlertDescription>
            Start by creating your family tree to begin succession planning.
          </AlertDescription>
        </Alert>
        
        <div className="flex flex-col items-center justify-center min-h-[60vh] border-2 border-dashed rounded-lg p-8">
          <Home className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">Welcome to Mirathi Family Services</h3>
          <p className="text-muted-foreground text-center mb-6 max-w-md">
            Create your digital family tree to secure your legacy, plan for succession, and manage guardianship.
          </p>
          <Button 
            onClick={() => setIsCreateFamilyOpen(true)}
            size="lg"
          >
            <Plus className="mr-2 h-4 w-4" />
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

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TreePine className="h-5 w-5 text-primary" />
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Family Dashboard
            </h1>
          </div>
          <p className="text-muted-foreground">
            Manage your succession plan and guardianship arrangements for the <strong>{myFamily.name}</strong> family
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => navigate('/dashboard/family/tree')}
            size="sm"
          >
            <ArrowRight className="mr-2 h-4 w-4" />
            View Tree
          </Button>
          <Button 
            onClick={() => navigate('/dashboard/family/tree?action=add')}
            size="sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Member
          </Button>
        </div>
      </div>

      {/* Family Info Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-xl font-bold">{myFamily.name}</h2>
              {myFamily.description && (
                <p className="text-muted-foreground">{myFamily.description}</p>
              )}
              <div className="flex items-center gap-3 text-sm">
                {myFamily.homeCounty && (
                  <Badge variant="outline">
                    {myFamily.homeCounty.replace(/_/g, ' ')}
                  </Badge>
                )}
                {myFamily.tribe && (
                  <Badge variant="secondary">{myFamily.tribe}</Badge>
                )}
                {myFamily.isPolygamous && (
                  <Badge variant="destructive">Polygamous Family</Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-2xl font-bold">{totalMembers}</div>
                <p className="text-xs text-muted-foreground">Total Members</p>
              </div>
              <Separator orientation="vertical" className="h-10" />
              <div className="text-right">
                <div className="text-2xl font-bold">{completenessScore}%</div>
                <p className="text-xs text-muted-foreground">Complete</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Family Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalMembers}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalMinors > 0 ? `${totalMinors} minors` : 'No minors'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completeness</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completenessScore}%</div>
            <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${completenessScore}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {hasMissingLinks ? 'Needs attention' : 'Complete'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Guardianship</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalMinors > 0 ? `${totalMinors} to assign` : 'Complete'}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalMinors > 0 ? 'Action required' : 'No minors'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Activity</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {myFamily.lastActivityAt 
                ? new Date(myFamily.lastActivityAt).toLocaleDateString('en-GB')
                : 'Never'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Updated {myFamily.updatedAt ? new Date(myFamily.updatedAt).toLocaleDateString('en-GB') : 'Never'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
            <CardDescription>
              Common tasks for your succession plan
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => navigate('/dashboard/family/tree?action=add')}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Family Member
            </Button>
            {totalMinors > 0 && (
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate('/dashboard/family/guardianships')}
              >
                <Baby className="mr-2 h-4 w-4" />
                Assign Guardians for Minors
              </Button>
            )}
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => navigate('/dashboard/family/heirs')}
            >
              <FileText className="mr-2 h-4 w-4" />
              View Heirs Analysis
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => navigate('/dashboard/family/tree')}
            >
              <TreePine className="mr-2 h-4 w-4" />
              View Family Tree
            </Button>
          </CardContent>
        </Card>

        {/* Status Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status Summary</CardTitle>
            <CardDescription>
              Current status of your succession plan
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Profile Completeness</span>
              <Badge variant={completenessScore > 80 ? "default" : "secondary"}>
                {completenessScore}%
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Missing Links</span>
              <Badge variant={hasMissingLinks ? "destructive" : "default"}>
                {hasMissingLinks ? "Yes" : "No"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Minors without Guardians</span>
              <Badge variant={totalMinors > 0 ? "destructive" : "default"}>
                {totalMinors}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Family Type</span>
              <Badge variant={myFamily.isPolygamous ? "destructive" : "default"}>
                {myFamily.isPolygamous ? "Polygamous" : "Monogamous"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="heirs" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-3">
          <TabsTrigger value="heirs">Heirs Analysis</TabsTrigger>
          <TabsTrigger value="updates">Recent Updates</TabsTrigger>
          <TabsTrigger value="help">Help & Resources</TabsTrigger>
        </TabsList>
        
        <TabsContent value="heirs" className="space-y-4">
          {isLoadingHeirs ? (
            <Skeleton className="h-64 w-full" />
          ) : heirsData ? (
            <HeirsOverview familyId={myFamily.id} />
          ) : (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>No Heirs Analysis Available</AlertTitle>
              <AlertDescription>
                Add more family members to generate heirs analysis.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
        
        <TabsContent value="updates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest changes to your family tree
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {myFamily.lastActivityAt ? (
                  <div className="flex items-start gap-3">
                    <div className="h-2 w-2 rounded-full bg-primary mt-2"></div>
                    <div>
                      <p className="font-medium">Last Updated</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(myFamily.lastActivityAt).toLocaleString('en-GB', {
                          dateStyle: 'medium',
                          timeStyle: 'short'
                        })}
                      </p>
                    </div>
                  </div>
                ) : (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      No recent activity recorded
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="help" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Help & Resources</CardTitle>
              <CardDescription>
                Legal guidance and support
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="bg-blue-50 border-blue-200">
                <FileText className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-800">Legal Disclaimer</AlertTitle>
                <AlertDescription className="text-blue-700 text-sm">
                  This platform provides guidance on succession planning based on Kenyan law. 
                  For binding legal advice, consult a qualified legal professional.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-3">
                <h4 className="font-medium">Quick Links</h4>
                <div className="grid grid-cols-1 gap-2">
                  <Button 
                    variant="ghost" 
                    className="justify-start"
                    onClick={() => window.open('https://kenyalaw.org/kl/fileadmin/pdfdownloads/Acts/LawsofSuccessionActCap160.pdf', '_blank')}
                  >
                    Law of Succession Act (PDF)
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="justify-start"
                    onClick={() => window.open('https://kenyalaw.org/kl/fileadmin/pdfdownloads/Acts/ChildrenAct_Cap_141.pdf', '_blank')}
                  >
                    Children Act (PDF)
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};