import React from 'react';
import { AlertOctagon, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Progress } from '../../../components/ui';
import { useGuardianshipRiskReport } from '../guardianship.api';
import { RiskLevelBadge } from './RiskLevelBadge';
import { LoadingSpinner } from '../../../components/common';

export const RiskAssessmentDashboard: React.FC<{ id: string }> = ({ id }) => {
  const { data, isLoading } = useGuardianshipRiskReport(id);

  if (isLoading) return <LoadingSpinner text="Analyzing risk factors..." />;
  if (!data) return null;

  return (
    <div className="space-y-6">
       {/* Header Score */}
       <Card className="border-t-4 border-t-blue-600">
          <CardContent className="pt-6">
             <div className="flex items-center justify-between mb-4">
                 <div>
                    <h3 className="font-semibold text-lg">Overall Risk Assessment</h3>
                    <p className="text-sm text-muted-foreground">Generated {new Date(data.generatedAt).toLocaleDateString()}</p>
                 </div>
                 <RiskLevelBadge level={data.overallRiskLevel} className="h-8 px-3" />
             </div>
             <div className="space-y-2">
                <div className="flex justify-between text-sm">
                    <span>Risk Score</span>
                    <span className="font-bold">{data.riskScore}/100</span>
                </div>
                <Progress value={data.riskScore} className="h-2" />
             </div>
          </CardContent>
       </Card>

       {/* Alerts */}
       <div className="grid gap-4 md:grid-cols-2">
          <Card>
             <CardHeader><CardTitle className="text-base">Active Alerts</CardTitle></CardHeader>
             <CardContent className="space-y-3">
                 {data.activeAlerts.length === 0 ? (
                    <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle2 className="h-5 w-5" />
                        <span className="text-sm">No active risks detected.</span>
                    </div>
                 ) : (
                    data.activeAlerts.map(alert => (
                        <div key={alert.code} className="flex items-start gap-3 rounded bg-slate-50 p-2 text-sm">
                            <AlertOctagon className="mt-0.5 h-4 w-4 text-amber-600" />
                            <div>
                                <p className="font-medium">{alert.description}</p>
                                <RiskLevelBadge level={alert.severity} className="mt-1 scale-75 origin-left" />
                            </div>
                        </div>
                    ))
                 )}
             </CardContent>
          </Card>

          <Card>
             <CardHeader><CardTitle className="text-base">Recommendations</CardTitle></CardHeader>
             <CardContent className="space-y-3">
                {data.automatedRecommendations.map((rec, i) => (
                    <div key={i} className="text-sm border-l-2 border-blue-400 pl-3">
                        <p className="font-medium">{rec.title}</p>
                        <p className="text-muted-foreground text-xs mt-1">{rec.action}</p>
                    </div>
                ))}
             </CardContent>
          </Card>
       </div>
    </div>
  );
};