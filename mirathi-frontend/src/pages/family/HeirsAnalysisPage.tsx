// ============================================================================
// FILE 2: src/pages/family/HeirsAnalysisPage.tsx
// Detailed heir analysis and succession planning
// ============================================================================

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Scale, 
  FileText, 
  AlertTriangle,
  Info,
  Download,
} from 'lucide-react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  Badge,
  Alert,
  AlertTitle,
  AlertDescription,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui';
import { HeirsOverview } from '@/features/family/components';
import { usePotentialHeirs, useMyFamily } from '@/features/family/family.api';

export const HeirsAnalysisPage: React.FC = () => {
  const { familyId } = useParams<{ familyId?: string }>();
  const navigate = useNavigate();
  
  const { data: myFamily } = useMyFamily();
  const effectiveFamilyId = familyId || myFamily?.id || '';
  
  const { data: heirs } = usePotentialHeirs(effectiveFamilyId, {
    enabled: !!effectiveFamilyId
  });

  const handleGenerateReport = () => {
    // TODO: Generate PDF report
    console.log('Generate heirs analysis report');
  };

  if (!effectiveFamilyId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">No family data available</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/dashboard/family')}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Heir Analysis</h1>
                <p className="text-sm text-muted-foreground">
                  Succession rights based on Kenyan law
                </p>
              </div>
            </div>

            <Button onClick={handleGenerateReport}>
              <Download className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 container mx-auto p-6 space-y-6">
        
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Heirs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{heirs?.heirs.length || 0}</div>
              <p className="text-xs text-muted-foreground">Identified beneficiaries</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Succession Type</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="outline" className="mb-2">
                {heirs?.regime || 'INTESTATE'}
              </Badge>
              <p className="text-xs text-muted-foreground">
                {heirs?.regime === 'TESTATE' ? 'With valid will' : 'Without will'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Legal Framework</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary" className="mb-2">
                {heirs?.religion || 'STATUTORY'}
              </Badge>
              <p className="text-xs text-muted-foreground">
                Applicable law system
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="heirs" className="space-y-4">
          <TabsList>
            <TabsTrigger value="heirs">Identified Heirs</TabsTrigger>
            <TabsTrigger value="legal">Legal Framework</TabsTrigger>
            <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
          </TabsList>

          <TabsContent value="heirs" className="space-y-4">
            <HeirsOverview familyId={effectiveFamilyId} />
          </TabsContent>

          <TabsContent value="legal" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Legal Framework</CardTitle>
                <CardDescription>
                  Understanding succession law in Kenya
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Scale className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h4 className="font-medium">Law of Succession Act (Cap 160)</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        The primary legislation governing inheritance in Kenya. Covers both
                        testate (with will) and intestate (without will) succession.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h4 className="font-medium">Section 40 - Distribution Rules</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Defines how estates are distributed among spouses, children, and
                        other dependents in intestate succession. Includes special provisions
                        for polygamous marriages.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h4 className="font-medium">Religious & Customary Law</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Islamic law applies through Kadhi's courts for Muslim estates.
                        Hindu Succession Act applies to Hindu families. Customary law may
                        apply in specific circumstances.
                      </p>
                    </div>
                  </div>
                </div>

                {heirs?.legalNote && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>{heirs.legalNote}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scenarios" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Succession Scenarios</CardTitle>
                <CardDescription>
                  How different situations affect inheritance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Scenario Analysis</AlertTitle>
                  <AlertDescription>
                    This feature shows how changes in family structure or legal status
                    would affect succession rights. Coming soon.
                  </AlertDescription>
                </Alert>

                <div className="grid gap-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">If spouse predeceases</h4>
                    <p className="text-sm text-muted-foreground">
                      Children would inherit the spouse's share per stirpes (by representation)
                    </p>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">If child is minor</h4>
                    <p className="text-sm text-muted-foreground">
                      Inheritance held in trust until age 18, managed by appointed guardian
                    </p>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">In polygamous marriage</h4>
                    <p className="text-sm text-muted-foreground">
                      Estate divided into houses, each house gets equal share before
                      distribution to members
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
