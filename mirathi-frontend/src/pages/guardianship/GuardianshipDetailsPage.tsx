import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Activity, Clock, Shield } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent, Button } from '../../components/ui';
import { LoadingSpinner } from '../../components/common';
import { 
    WardProfile, ComplianceHealthScore, ComplianceTimeline, 
    GuardianCard, RiskAssessmentDashboard 
} from '../../features/guardianship/components';
import { useGuardianshipDetails } from '../../features/guardianship/guardianship.api';

export const GuardianshipDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState('overview');
  const { data, isLoading } = useGuardianshipDetails(id!);

  if (isLoading || !data) return <div className="h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="p-6 space-y-8 pb-20">
       {/* Header */}
       <div className="flex flex-col md:flex-row justify-between items-start gap-6">
          <WardProfile ward={data.ward} />
          <div className="flex gap-2">
             <Button variant="outline">Case Files</Button>
             <Button>Add Report</Button>
          </div>
       </div>

       {/* Tabs */}
       <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-6">
             <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2">Overview</TabsTrigger>
             <TabsTrigger value="timeline" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2">Timeline</TabsTrigger>
             <TabsTrigger value="risk" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2">Risk Assessment</TabsTrigger>
          </TabsList>

          <div className="mt-6">
             <TabsContent value="overview" className="space-y-6">
                <div className="grid gap-6 md:grid-cols-3">
                    <div className="md:col-span-2 space-y-6">
                        <h3 className="font-semibold text-lg flex items-center gap-2"><Shield className="h-5 w-5" /> Guardians</h3>
                        <div className="grid gap-4">
                            {data.guardians.map(g => <GuardianCard key={g.guardianId} guardian={g} />)}
                        </div>
                    </div>
                    <div>
                        <ComplianceHealthScore 
                            score={data.compliance.score} 
                            nextReportDue={data.compliance.nextReportDue} 
                            isBonded={data.compliance.isBonded} 
                        />
                    </div>
                </div>
             </TabsContent>

             <TabsContent value="timeline">
                <div className="max-w-3xl">
                    <h3 className="font-semibold text-lg mb-6 flex items-center gap-2"><Clock className="h-5 w-5" /> History & Reports</h3>
                    <ComplianceTimeline id={id!} />
                </div>
             </TabsContent>

             <TabsContent value="risk">
                <div className="max-w-4xl">
                    <h3 className="font-semibold text-lg mb-6 flex items-center gap-2"><Activity className="h-5 w-5" /> AI Risk Analysis</h3>
                    <RiskAssessmentDashboard id={id!} />
                </div>
             </TabsContent>
          </div>
       </Tabs>
    </div>
  );
};