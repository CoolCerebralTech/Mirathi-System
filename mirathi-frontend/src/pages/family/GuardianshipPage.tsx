// FILE: src/pages/family/GuardianshipPage.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Shield, 
  Users, 
  AlertTriangle,
  Baby,
  FileText
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Alert,
  AlertDescription,
  AlertTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Badge,
} from '@/components/ui';

import { GuardianshipManager } from '@/features/family/components'; 

import { 
  useMyFamily, 
  useMyFamilyTree,
} from '@/api/family/family.api';

export const GuardianshipPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedWardId, setSelectedWardId] = useState<string>('');
  
  const { data: myFamily, isLoading: loadingFamily } = useMyFamily();
  const { data: tree, isLoading: loadingTree } = useMyFamilyTree();
  
  // Get wardId from URL if present (e.g., redirected from Tree view)
  const wardIdFromUrl = searchParams.get('wardId');
  
  // Memoized minors calculation
  // We strictly check for 'isMinor' property from the TreeChild type
  const minors = useMemo(() => 
    tree?.children?.filter(child => child.isMinor) || [], 
    [tree?.children]
  );
  
  // Set initial selected ward based on URL or default to first minor
  useEffect(() => {
    if (wardIdFromUrl && minors.some(m => m.id === wardIdFromUrl)) {
      setSelectedWardId(wardIdFromUrl);
    } else if (minors.length > 0 && !selectedWardId) {
      setSelectedWardId(minors[0].id);
    }
  }, [minors, wardIdFromUrl, selectedWardId]);

  // Loading State
  if (loadingFamily || loadingTree) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <Skeleton className="h-32 w-full rounded-xl" />
           <Skeleton className="h-32 w-full rounded-xl" />
           <Skeleton className="h-32 w-full rounded-xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
           <Skeleton className="h-96 w-full rounded-xl lg:col-span-1" />
           <Skeleton className="h-96 w-full rounded-xl lg:col-span-2" />
        </div>
      </div>
    );
  }

  // No Family Found State
  if (!myFamily) {
    return (
      <div className="container mx-auto p-6 flex flex-col items-center justify-center min-h-[60vh]">
        <Alert className="max-w-md bg-amber-50 border-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">Family Tree Required</AlertTitle>
          <AlertDescription className="text-amber-700">
            You must create a family tree before you can assign guardians.
          </AlertDescription>
        </Alert>
        <div className="flex justify-center mt-6">
          <Button onClick={() => navigate('/dashboard/family')}>
            Go to Family Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/dashboard/family')}
            className="shrink-0 text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Guardianship Management
              </h1>
            </div>
            <p className="text-slate-500">
              Assign and manage legal guardians for minors in the <strong>{myFamily.name}</strong>.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => navigate('/dashboard/family/tree')}
            size="sm"
          >
            <Users className="mr-2 h-4 w-4" />
            View Family Tree
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total Minors
                </p>
                <p className="text-3xl font-bold text-slate-900">
                  {minors.length}
                </p>
              </div>
              <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                 <Baby className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  With Guardians
                </p>
                <p className="text-3xl font-bold text-slate-900">
                  {/* Placeholder until API returns aggregate stats */}
                  -
                </p>
              </div>
              <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                 <Shield className="h-6 w-6 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Action Required
                </p>
                <p className="text-3xl font-bold text-slate-900">
                  {/* Placeholder until API returns aggregate stats */}
                  {minors.length > 0 ? 'Yes' : 'None'}
                </p>
              </div>
              <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                 <AlertTriangle className="h-6 w-6 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Selection Panel */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Select Minor</CardTitle>
              <CardDescription>
                Choose a child to manage their guardianship status.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {minors.length > 0 ? (
                <div className="space-y-4">
                  {/* Dropdown for Mobile */}
                  <div className="block sm:hidden">
                    <Select 
                      value={selectedWardId} 
                      onValueChange={setSelectedWardId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a minor..." />
                      </SelectTrigger>
                      <SelectContent>
                        {minors.map((minor) => (
                          <SelectItem key={minor.id} value={minor.id}>
                            {minor.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* List for Desktop */}
                  <div className="hidden sm:block space-y-2">
                    {minors.map((minor) => (
                      <div
                        key={minor.id}
                        className={`
                          p-3 rounded-lg border cursor-pointer transition-all duration-200
                          ${selectedWardId === minor.id 
                            ? 'border-primary bg-primary/5 ring-1 ring-primary/20' 
                            : 'border-slate-200 hover:bg-slate-50 hover:border-primary/30'}
                        `}
                        onClick={() => setSelectedWardId(minor.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                              {minor.name.charAt(0)}
                            </div>
                            <span className="font-medium text-sm text-slate-700">{minor.name}</span>
                          </div>
                          <Badge variant="outline" className="text-[10px] bg-white">
                            Minor
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <Alert className="bg-slate-50">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>No Minors Found</AlertTitle>
                  <AlertDescription>
                    There are no members under 18 in your current family tree.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Legal Info Card */}
          <Card className="bg-blue-50/50 border-blue-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-blue-900 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Legal Requirements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-blue-800">
              <div className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                <span>Guardian must be an adult (18+)</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                <span>Clean criminal record required</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                <span>Financially & mentally capable</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                <span>Willing to accept responsibility</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Manager Component */}
        <div className="lg:col-span-2">
          {selectedWardId ? (
            <GuardianshipManager
              familyId={myFamily.id}
              wardId={selectedWardId}
            />
          ) : minors.length > 0 ? (
            <Card className="h-full border-dashed shadow-none">
              <CardContent className="flex flex-col items-center justify-center h-full p-12 text-center min-h-[400px]">
                <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                   <Shield className="h-8 w-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Select a Minor</h3>
                <p className="text-slate-500 max-w-sm">
                  Select a child from the list on the left to view their status or assign a new guardian.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full border-dashed shadow-none">
              <CardContent className="flex flex-col items-center justify-center h-full p-12 text-center min-h-[400px]">
                <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                   <Baby className="h-8 w-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No Minors Found</h3>
                <p className="text-slate-500 max-w-sm mb-6">
                  Guardianship is only applicable for family members under 18 years of age.
                </p>
                <Button variant="outline" onClick={() => navigate('/dashboard/family/tree?action=add')}>
                  Add Family Member
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Footer Tabs: Legal Info */}
      {minors.length > 0 && (
        <Tabs defaultValue="guidelines" className="mt-8">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="guidelines">Legal Guidelines</TabsTrigger>
            <TabsTrigger value="responsibilities">Guardian Duties</TabsTrigger>
          </TabsList>
          
          <TabsContent value="guidelines" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Legal Framework (Children Act)</CardTitle>
                <CardDescription>
                  Key provisions from Cap 141 regarding guardianship.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <h4 className="font-semibold text-slate-900">Testamentary Guardians</h4>
                  <p className="text-sm text-slate-500">
                    (Section 70) Parents can appoint guardians by deed or will. These appointments take effect upon the death of the appointing parent.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-slate-900">Court Appointments</h4>
                  <p className="text-sm text-slate-500">
                    (Section 73) If no guardian is appointed by will, the court may appoint one. It's safer to specify your choice in advance.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-slate-900">Best Interests</h4>
                  <p className="text-sm text-slate-500">
                    (Section 24) All decisions concerning the child must prioritize their best interests above all other considerations.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="responsibilities" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Guardian Responsibilities</CardTitle>
                <CardDescription>
                  What is expected of an appointed guardian?
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="grid md:grid-cols-2 gap-4">
                  <li className="flex gap-3 items-start p-3 bg-slate-50 rounded-lg">
                    <Shield className="h-5 w-5 text-primary mt-0.5" />
                    <span className="text-sm text-slate-700">Provide shelter, food, and daily care for the child.</span>
                  </li>
                  <li className="flex gap-3 items-start p-3 bg-slate-50 rounded-lg">
                    <Shield className="h-5 w-5 text-primary mt-0.5" />
                    <span className="text-sm text-slate-700">Make decisions regarding education and medical care.</span>
                  </li>
                  <li className="flex gap-3 items-start p-3 bg-slate-50 rounded-lg">
                    <Shield className="h-5 w-5 text-primary mt-0.5" />
                    <span className="text-sm text-slate-700">Manage the child's property and inheritance until adulthood.</span>
                  </li>
                  <li className="flex gap-3 items-start p-3 bg-slate-50 rounded-lg">
                    <Shield className="h-5 w-5 text-primary mt-0.5" />
                    <span className="text-sm text-slate-700">Act as the legal representative in legal matters.</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};