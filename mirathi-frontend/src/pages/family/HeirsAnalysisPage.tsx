// src/pages/HeirsAnalysisPage.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  FileText, 
  Download, 
  AlertTriangle,
  Scale,
  BookOpen} from 'lucide-react';
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
  Badge,
  Skeleton,
} from '@/components/ui';
import { HeirsOverview } from '@/features/family/components';
import { 
  useMyFamily, 
  usePotentialHeirs 
} from '@/features/family/family.api';

export const HeirsAnalysisPage: React.FC = () => {
  const navigate = useNavigate();
  
  const { data: myFamily, isLoading: loadingFamily } = useMyFamily();
  const { 
    data: heirsData, 
    isLoading: loadingHeirs,
    error: heirsError,
    refetch 
  } = usePotentialHeirs(myFamily?.id || '', {
    enabled: !!myFamily?.id
  });

  const handleExportReport = () => {
    // TODO: Implement PDF export of heirs report
    console.log('Export heirs report');
  };

  const handleGenerateLegalSummary = () => {
    // TODO: Implement legal summary generation
    console.log('Generate legal summary');
  };

  if (loadingFamily) {
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
            You must create a family tree to view heirs analysis.
          </AlertDescription>
        </Alert>
        <div className="flex justify-center mt-6">
          <Button onClick={() => navigate('/dashboard')}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (heirsError) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Failed to Load Heirs Analysis</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>{heirsError.message}</p>
            <Button variant="outline" onClick={() => refetch()}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
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
            onClick={() => navigate('/dashboard')}
            className="shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Heirs Analysis
            </h1>
            <p className="text-muted-foreground">
              Succession planning based on Kenyan Law of Succession Act (Cap 160)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Button 
            variant="outline" 
            onClick={handleExportReport}
            size="sm"
          >
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
          <Button 
            onClick={handleGenerateLegalSummary}
            size="sm"
          >
            <FileText className="mr-2 h-4 w-4" />
            Legal Summary
          </Button>
        </div>
      </div>

      {/* Legal Disclaimer */}
      <Alert className="bg-blue-50 border-blue-200">
        <Scale className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-800">Legal Disclaimer</AlertTitle>
        <AlertDescription className="text-blue-700">
          This analysis is based on the information provided and Kenyan succession law. 
          It is for informational purposes only and does not constitute legal advice. 
          Consult with a qualified legal professional for estate planning.
        </AlertDescription>
      </Alert>

      {/* Main Content */}
      <Tabs defaultValue="analysis" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-3">
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="legal">Legal Basis</TabsTrigger>
        </TabsList>
        
        <TabsContent value="analysis" className="space-y-4">
          {loadingHeirs ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : heirsData ? (
            <>
              <HeirsOverview familyId={myFamily.id} />
              
              {/* Additional Insights */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Key Insights</CardTitle>
                  <CardDescription>
                    Important considerations for your succession plan
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {heirsData.heirs.some(h => h.isMinor) && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Minors Detected</AlertTitle>
                      <AlertDescription>
                        {heirsData.heirs.filter(h => h.isMinor).length} minor heir(s) identified. 
                        Consider establishing trusts or appointing guardians.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {heirsData.heirs.some(h => h.category === 'WARNING') && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Potential Issues</AlertTitle>
                      <AlertDescription>
                        Some heirs may face legal challenges. Review the warnings section for details.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </>
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
        
        <TabsContent value="details" className="space-y-4">
          {loadingHeirs ? (
            <Skeleton className="h-64 w-full" />
          ) : heirsData ? (
            <Card>
              <CardHeader>
                <CardTitle>Detailed Breakdown</CardTitle>
                <CardDescription>
                  Comprehensive analysis of each potential heir
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {heirsData.heirs.map((heir) => (
                  <div 
                    key={heir.id} 
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{heir.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary">
                            {heir.category}
                          </Badge>
                          <Badge variant="outline">
                            Priority: {heir.priority}
                          </Badge>
                          {heir.isMinor && (
                            <Badge variant="destructive">Minor</Badge>
                          )}
                        </div>
                      </div>
                      {heir.house && (
                        <Badge>{heir.house}</Badge>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        {heir.description}
                      </p>
                      <div className="bg-slate-50 p-3 rounded text-sm">
                        <strong className="text-slate-700">Legal Basis:</strong>
                        <p className="mt-1">{heir.legalBasis}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>No Data Available</AlertTitle>
              <AlertDescription>
                Complete your family tree to see detailed analysis.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
        
        <TabsContent value="legal">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Legal References
              </CardTitle>
              <CardDescription>
                Kenyan Law of Succession Act (Cap 160) and relevant provisions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-6">
                <section>
                  <h4 className="font-bold text-lg mb-2">Section 40: Intestate Succession</h4>
                  <p className="text-muted-foreground">
                    Governs distribution when there is no valid will. Priority: 
                    Surviving spouse → Children → Parents → Siblings → Other relatives.
                  </p>
                </section>
                
                <section>
                  <h4 className="font-bold text-lg mb-2">Section 35: Surviving Spouse</h4>
                  <p className="text-muted-foreground">
                    Rights of the surviving spouse in intestate succession, including 
                    personal and household effects, and life interest in the residue.
                  </p>
                </section>
                
                <section>
                  <h4 className="font-bold text-lg mb-2">Section 36: Children's Share</h4>
                  <p className="text-muted-foreground">
                    How children inherit in the absence of a surviving spouse. 
                    Includes biological, adopted, and children born out of wedlock.
                  </p>
                </section>
                
                <section>
                  <h4 className="font-bold text-lg mb-2">Section 39: Parents and Siblings</h4>
                  <p className="text-muted-foreground">
                    Inheritance rights of parents and siblings when there is no 
                    surviving spouse or children.
                  </p>
                </section>
              </div>
              
              <Alert className="mt-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Important Note</AlertTitle>
                <AlertDescription>
                  This information is for reference only. Estate planning should be 
                  done in consultation with a qualified legal professional.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};