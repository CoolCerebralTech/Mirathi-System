// src/pages/family/GuardianshipPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Shield, 
  Users, 
  AlertTriangle,
  Baby,
  FileText} from 'lucide-react';
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
  
  // Get wardId from URL if present
  const wardIdFromUrl = searchParams.get('wardId');
  
  // Memoized minors calculation to fix React Hook dependency warning
  const minors = useMemo(() => 
    tree?.children?.filter(child => child.isMinor) || [], 
    [tree?.children]
  );
  
  // Set initial selected ward
  useEffect(() => {
    if (wardIdFromUrl && minors.some(m => m.id === wardIdFromUrl)) {
      setSelectedWardId(wardIdFromUrl);
    } else if (minors.length > 0 && !selectedWardId) {
      setSelectedWardId(minors[0].id);
    }
  }, [minors, wardIdFromUrl, selectedWardId]);

  if (loadingFamily || loadingTree) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!myFamily) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>No Family Tree Found</AlertTitle>
          <AlertDescription>
            You must create a family tree to manage guardianship.
          </AlertDescription>
        </Alert>
        <div className="flex justify-center mt-6">
          <Button onClick={() => navigate('/family/dashboard')}>
            Go to Family Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/family/dashboard')}
            className="shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Guardianship Management
            </h1>
            <p className="text-muted-foreground">
              Assign and manage guardians for minors in your family
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => navigate('/family/tree')}
            size="sm"
          >
            <Users className="mr-2 h-4 w-4" />
            View Family Tree
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Minors
                </p>
                <p className="text-2xl font-bold">
                  {minors.length}
                </p>
              </div>
              <Baby className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  With Guardians
                </p>
                <p className="text-2xl font-bold">
                  {/* TODO: Calculate from guardianship status */}
                  0
                </p>
              </div>
              <Shield className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Action Required
                </p>
                <p className="text-2xl font-bold">
                  {minors.length} {/* TODO: Subtract those with guardians */}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ward Selection Panel */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Select Minor</CardTitle>
              <CardDescription>
                Choose a minor to assign or manage guardianship
              </CardDescription>
            </CardHeader>
            <CardContent>
              {minors.length > 0 ? (
                <div className="space-y-4">
                  <Select 
                    value={selectedWardId} 
                    onValueChange={setSelectedWardId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a minor" />
                    </SelectTrigger>
                    <SelectContent>
                      {minors.map((minor) => (
                        <SelectItem key={minor.id} value={minor.id}>
                          {minor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <div className="space-y-3">
                    {minors.map((minor) => (
                      <div
                        key={minor.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedWardId === minor.id 
                            ? 'border-primary bg-primary/5' 
                            : 'hover:bg-slate-50'
                        }`}
                        onClick={() => setSelectedWardId(minor.id)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{minor.name}</span>
                          <Badge variant="outline">
                            {/* Removed age since it doesn't exist in TreeChild type */}
                            Minor
                          </Badge>
                        </div>
                        {/* TODO: Add guardian status badge */}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>No Minors Found</AlertTitle>
                  <AlertDescription>
                    There are no minors (under 18) in your family tree.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Legal Requirements Card */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Legal Requirements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                <span>Guardian must be over 18 years old</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                <span>No criminal record involving children</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                <span>Financially stable and mentally capable</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                <span>Willing to accept legal responsibilities</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Guardianship Manager Panel */}
        <div className="lg:col-span-2">
          {selectedWardId ? (
            <GuardianshipManager
              familyId={myFamily.id}
              wardId={selectedWardId}
            />
          ) : minors.length > 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                <Shield className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Select a Minor</h3>
                <p className="text-muted-foreground">
                  Choose a minor from the list to begin guardianship assignment
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                <Baby className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Minors Found</h3>
                <p className="text-muted-foreground mb-4">
                  Guardianship is only required for family members under 18 years old.
                </p>
                <Button onClick={() => navigate('/family/tree?action=add')}>
                  Add Family Member
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Legal Information Tabs */}
      {minors.length > 0 && (
        <Tabs defaultValue="guidelines" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="guidelines">Legal Guidelines</TabsTrigger>
            <TabsTrigger value="responsibilities">Guardian Duties</TabsTrigger>
          </TabsList>
          
          <TabsContent value="guidelines">
            <Card>
              <CardHeader>
                <CardTitle>Legal Framework</CardTitle>
                <CardDescription>
                  Kenyan Children Act (Cap 141) and guardianship provisions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <h4 className="font-bold">Section 70: Testamentary Guardians</h4>
                  <p className="text-sm text-muted-foreground">
                    You can appoint a guardian in your will. The court will consider 
                    your appointment but must ensure it's in the child's best interest.
                  </p>
                </div>
                <div className="space-y-3">
                  <h4 className="font-bold">Section 73: Court Appointment</h4>
                  <p className="text-sm text-muted-foreground">
                    The court may appoint a guardian if no testamentary guardian exists 
                    or if the appointed guardian is unsuitable.
                  </p>
                </div>
                <div className="space-y-3">
                  <h4 className="font-bold">Section 24: Best Interests Principle</h4>
                  <p className="text-sm text-muted-foreground">
                    All decisions must prioritize the child's best interests, including 
                    their physical, emotional, and educational needs.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="responsibilities">
            <Card>
              <CardHeader>
                <CardTitle>Guardian Responsibilities</CardTitle>
                <CardDescription>
                  Duties and obligations of appointed guardians
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
                    <span>Provide care, protection, and maintenance for the child</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
                    <span>Make decisions about education, health, and welfare</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
                    <span>Manage the child's property and inheritance responsibly</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
                    <span>Report to the court as required by law</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
                    <span>Act in the child's best interests at all times</span>
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