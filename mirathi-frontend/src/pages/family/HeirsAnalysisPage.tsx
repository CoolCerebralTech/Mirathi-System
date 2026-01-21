// FILE: src/pages/family/HeirsAnalysisPage.tsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  FileText, 
  Download, 
  AlertTriangle,
  Scale,
  BookOpen
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
  Badge,
  Skeleton,
} from '@/components/ui';

import { HeirsOverview } from '@/features/family/components';

import { 
  useMyFamily, 
  usePotentialHeirs 
} from '@/api/family/family.api';

export const HeirsAnalysisPage: React.FC = () => {
  const navigate = useNavigate();
  
  const { data: myFamily, isLoading: loadingFamily } = useMyFamily();
  
  // Note: we use myFamily.id here. If it's undefined, query is disabled.
  const { 
    data: heirsData, 
    isLoading: loadingHeirs,
    error: heirsError,
    refetch 
  } = usePotentialHeirs(myFamily?.id || '', {
    enabled: !!myFamily?.id
  });

  const handleExportReport = () => {
    // TODO: Implement PDF export of heirs report via backend API
    console.log('Export heirs report triggered');
  };

  const handleGenerateLegalSummary = () => {
    // TODO: Implement legal summary generation
    console.log('Generate legal summary triggered');
  };

  // 1. Loading State (Family)
  if (loadingFamily) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  // 2. No Family Found State
  if (!myFamily) {
    return (
      <div className="container mx-auto p-6 flex flex-col items-center justify-center min-h-[60vh]">
        <Alert className="max-w-md bg-amber-50 border-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">No Family Tree Found</AlertTitle>
          <AlertDescription className="text-amber-700">
            You must create a family tree to generate an heirs analysis report.
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

  // 3. Error State (Heirs API)
  if (heirsError) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Failed to Load Analysis</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>{heirsError.message || 'An error occurred while analyzing inheritance.'}</p>
            <Button variant="outline" onClick={() => refetch()} size="sm">
              Retry Analysis
            </Button>
          </AlertDescription>
        </Alert>
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
              <Scale className="h-5 w-5 text-primary" />
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Heirs Analysis
              </h1>
            </div>
            <p className="text-slate-500 max-w-2xl">
              Succession planning analysis based on the Kenyan Law of Succession Act (Cap 160).
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

      {/* Legal Disclaimer Alert */}
      <Alert className="bg-blue-50 border-blue-200 shadow-sm">
        <Scale className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-800 font-semibold">Legal Disclaimer</AlertTitle>
        <AlertDescription className="text-blue-700 text-sm">
          This analysis is generated automatically based on the information provided and standard Kenyan succession laws. 
          It is for informational purposes only and does not constitute binding legal advice. 
          Always consult with a qualified legal professional for estate planning.
        </AlertDescription>
      </Alert>

      {/* Main Content Tabs */}
      <Tabs defaultValue="analysis" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="legal">Legal Basis</TabsTrigger>
        </TabsList>
        
        {/* TAB 1: ANALYSIS OVERVIEW */}
        <TabsContent value="analysis" className="space-y-6">
          {loadingHeirs ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-64 w-full rounded-xl" />
            </div>
          ) : heirsData ? (
            <>
              {/* Main Visual Component */}
              <HeirsOverview familyId={myFamily.id} />
              
              {/* Key Insights Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Key Insights</CardTitle>
                  <CardDescription>
                    Critical considerations for your succession plan based on current data.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {heirsData.heirs.some(h => h.isMinor) && (
                    <Alert className="bg-amber-50 border-amber-200">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <AlertTitle className="text-amber-800">Minors Detected</AlertTitle>
                      <AlertDescription className="text-amber-700 text-sm">
                        {heirsData.heirs.filter(h => h.isMinor).length} minor heir(s) identified. 
                        Under Section 70, you should consider appointing testamentary guardians or establishing trusts.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {heirsData.heirs.some(h => h.category === 'WARNING') && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Potential Issues</AlertTitle>
                      <AlertDescription className="text-sm">
                        Some heirs or family structures may face complex legal challenges. Review the "Details" tab for specific warnings.
                      </AlertDescription>
                    </Alert>
                  )}

                  {!heirsData.heirs.some(h => h.isMinor) && !heirsData.heirs.some(h => h.category === 'WARNING') && (
                    <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                       <span className="font-bold">✓ Standard Distribution:</span> 
                       No immediate critical issues detected in the heir structure.
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>No Heirs Analysis Available</AlertTitle>
              <AlertDescription>
                Add more family members to your tree to generate an heirs analysis.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
        
        {/* TAB 2: DETAILED BREAKDOWN */}
        <TabsContent value="details" className="space-y-4">
          {loadingHeirs ? (
            <Skeleton className="h-96 w-full rounded-xl" />
          ) : heirsData ? (
            <Card>
              <CardHeader>
                <CardTitle>Detailed Breakdown</CardTitle>
                <CardDescription>
                  Comprehensive legal reasoning for each potential beneficiary.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {heirsData.heirs.map((heir) => (
                  <div 
                    key={heir.id} 
                    className="border rounded-lg p-4 space-y-3 bg-white hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div>
                        <h4 className="font-semibold text-slate-900">{heir.name}</h4>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <Badge variant="secondary" className="font-normal">
                            {heir.category}
                          </Badge>
                          <Badge variant="outline" className="font-normal text-slate-500">
                            Priority: {heir.priority}
                          </Badge>
                          {heir.isMinor && (
                            <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 font-normal">
                              Minor
                            </Badge>
                          )}
                        </div>
                      </div>
                      {heir.house && (
                        <Badge variant="outline" className="self-start">
                          {heir.house}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {heir.description}
                      </p>
                      <div className="bg-slate-50 p-3 rounded-md text-xs border border-slate-100">
                        <strong className="text-slate-700 block mb-1">Legal Basis:</strong>
                        <span className="text-slate-500 font-mono">{heir.legalBasis}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>No Data</AlertTitle>
              <AlertDescription>
                Complete your family tree to see detailed analysis.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
        
        {/* TAB 3: LEGAL REFERENCES */}
        <TabsContent value="legal">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-slate-600" />
                Legal References
              </CardTitle>
              <CardDescription>
                Key sections of the Kenyan Law of Succession Act (Cap 160) used in this analysis.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <section>
                <h4 className="font-bold text-base text-slate-900 mb-1">Section 40: Intestate Succession</h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Governs distribution when there is no valid will. It establishes the priority of inheritance: 
                  Surviving spouse → Children → Parents → Siblings → Other relatives.
                </p>
              </section>
              
              <section>
                <h4 className="font-bold text-base text-slate-900 mb-1">Section 35: Surviving Spouse</h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Rights of the surviving spouse in intestate succession, typically including 
                  all personal and household effects absolutely, and a life interest in the residue of the estate.
                </p>
              </section>
              
              <section>
                <h4 className="font-bold text-base text-slate-900 mb-1">Section 36: Children's Share</h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Describes how children inherit in the absence of a surviving spouse. 
                  The law recognizes biological children, legally adopted children, and children born out of wedlock 
                  (if paternity is acknowledged or proven).
                </p>
              </section>
              
              <section>
                <h4 className="font-bold text-base text-slate-900 mb-1">Section 39: Parents and Siblings</h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Defines the inheritance rights of parents and siblings (or their children) 
                  only when there is no surviving spouse or children to inherit.
                </p>
              </section>
              
              <Alert className="mt-4 bg-slate-50">
                <AlertTriangle className="h-4 w-4 text-slate-500" />
                <AlertTitle className="text-slate-700">Important Note</AlertTitle>
                <AlertDescription className="text-slate-600 text-xs">
                  Statutory laws may change. This reference is based on the current Act (Cap 160) 
                  and should be verified with current statutes.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};