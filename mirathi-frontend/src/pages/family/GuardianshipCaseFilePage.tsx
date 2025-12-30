import * as React from 'react';
import { useParams } from 'react-router-dom';

import { useGuardianshipDetails } from '../../features/family/guardianship/guardianship.api';
import { RiskAssessmentCard } from '../../features/family/guardianship/components/RiskAssessmentCard';
import { ComplianceTimeline } from '../../features/family/guardianship/components/ComplianceTimeline';
import { AppointGuardianDialog } from '../../features/family/guardianship/components/AppointGuardianDialog';

import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/Tabs';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/common/Avatar';

export function GuardianshipCaseFilePage() {
  const { id } = useParams<{ id: string }>();
  const { data: file, isLoading } = useGuardianshipDetails(id || '');

  if (isLoading || !file) return <div className="h-screen flex items-center justify-center"><LoadingSpinner /></div>;

  return (
    <div className="space-y-6 p-6">
      {/* Case Header */}
      <div className="bg-white p-6 rounded-lg shadow-sm border space-y-4">
        <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16" fallback={file.ward.name[0]} src={file.ward.photoUrl} />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900">{file.ward.name}</h1>
                <Badge variant="outline" className="text-xs">Age: {file.ward.age}</Badge>
              </div>
              <p className="text-slate-500">Case No: <span className="font-mono text-slate-700">{file.caseNumber}</span></p>
              <div className="flex gap-2 mt-2">
                <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">{file.legal.type}</Badge>
                <Badge variant="outline">{file.legal.jurisdiction}</Badge>
              </div>
            </div>
          </div>

          <div className="text-right">
             <div className="text-sm text-muted-foreground">Compliance Score</div>
             <div className={`text-3xl font-bold ${file.compliance.score > 80 ? 'text-green-600' : 'text-amber-600'}`}>
               {file.compliance.score}%
             </div>
             <div className="text-xs text-slate-500 mt-1">
               Next Report: {new Date(file.compliance.nextReportDue).toLocaleDateString()}
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Risk & Guardians */}
        <div className="lg:col-span-1 space-y-6">
           <RiskAssessmentCard guardianshipId={file.id} />
           
           <Card>
             <CardHeader className="flex flex-row items-center justify-between">
               <CardTitle className="text-lg">Appointed Guardians</CardTitle>
               {/* In a real scenario, you'd pick a candidate from family list */}
               <AppointGuardianDialog 
                  guardianshipId={file.id} 
                  candidateMemberId="" 
                  candidateName="Select Member" 
               />
             </CardHeader>
             <CardContent className="space-y-4">
               {file.guardians.map(g => (
                 <div key={g.guardianId} className="flex items-center gap-3 p-3 rounded-md bg-slate-50 border">
                    <Avatar fallback={g.name[0]} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{g.name}</p>
                      <p className="text-xs text-muted-foreground">{g.role} • {g.relationshipToWard}</p>
                    </div>
                    {g.isPrimary && <Badge className="text-[10px] h-5">Primary</Badge>}
                 </div>
               ))}
             </CardContent>
           </Card>
        </div>

        {/* Right Column: Timeline & Documents */}
        <div className="lg:col-span-2">
           <Tabs defaultValue="timeline">
             <TabsList className="w-full justify-start">
               <TabsTrigger value="timeline">Audit Trail</TabsTrigger>
               <TabsTrigger value="documents">Court Documents</TabsTrigger>
               <TabsTrigger value="financials">Financials</TabsTrigger>
             </TabsList>
             
             <TabsContent value="timeline" className="mt-4">
               <ComplianceTimeline guardianshipId={file.id} />
             </TabsContent>
             
             <TabsContent value="documents" className="mt-4">
               <Card><CardContent className="py-8 text-center text-muted-foreground">Document Management Module</CardContent></Card>
             </TabsContent>

             <TabsContent value="financials" className="mt-4">
                <Card><CardContent className="py-8 text-center text-muted-foreground">Financial Ledger Module</CardContent></Card>
             </TabsContent>
           </Tabs>
        </div>
      </div>
    </div>
  );
}