import { ShieldAlert, ShieldCheck, Info } from 'lucide-react';
import { useGuardianshipRiskReport } from '../../guardianship/guardianship.api';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Progress } from '../../../components/ui/Progress';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';

interface RiskAssessmentCardProps {
  guardianshipId: string;
}

export function RiskAssessmentCard({ guardianshipId }: RiskAssessmentCardProps) {
  const { data, isLoading } = useGuardianshipRiskReport(guardianshipId);

  if (isLoading) return <LoadingSpinner />;
  if (!data) return null;

  const isHighRisk = data.riskScore > 50;
  
  return (
    <Card className="border-t-4 border-t-primary">
      <CardHeader>
        <div className="flex items-center gap-2">
          {isHighRisk ? <ShieldAlert className="text-red-500" /> : <ShieldCheck className="text-green-500" />}
          <CardTitle>AI Risk Assessment</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Score Visual */}
        <div className="space-y-2">
           <div className="flex justify-between text-sm">
             <span className="font-medium">Risk Score</span>
             <span className={`font-bold ${isHighRisk ? 'text-red-600' : 'text-green-600'}`}>
               {data.riskScore}/100
             </span>
           </div>
           <Progress value={data.riskScore} className="h-3" />
           <p className="text-xs text-muted-foreground text-right">
             Level: <span className="uppercase font-bold">{data.overallRiskLevel}</span>
           </p>
        </div>

        {/* Alerts List */}
        {data.activeAlerts.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Active Alerts</h4>
            <div className="space-y-2">
              {data.activeAlerts.map((alert, idx) => (
                <div key={idx} className="flex gap-2 p-2 bg-slate-50 rounded border border-slate-100 text-sm">
                  <Info className={`h-4 w-4 mt-0.5 ${alert.severity === 'CRITICAL' ? 'text-red-500' : 'text-amber-500'}`} />
                  <div>
                    <p className="font-medium text-xs">{alert.code}</p>
                    <p className="text-muted-foreground text-xs">{alert.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        <div className="bg-blue-50 p-3 rounded-md">
           <h4 className="text-sm font-semibold text-blue-900 mb-2">Automated Recommendations</h4>
           <ul className="list-disc pl-4 space-y-1">
             {data.automatedRecommendations.slice(0, 3).map((rec, idx) => (
               <li key={idx} className="text-xs text-blue-800">
                 {rec.action}
               </li>
             ))}
           </ul>
        </div>
      </CardContent>
    </Card>
  );
}