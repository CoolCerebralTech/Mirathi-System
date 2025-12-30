import { ShieldCheck, ShieldAlert, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';
import { useWillCompliance } from '../will.api';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Progress } from '../../../components/ui/Progress';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import { Badge } from '../../../components/ui/Badge';

export function WillComplianceWidget({ willId }: { willId: string }) {
  const { data, isLoading } = useWillCompliance(willId);

  if (isLoading) return <LoadingSpinner />;
  if (!data) return null;

  const isCompliant = data.overallStatus === 'COMPLIANT';

  return (
    <Card className="h-full border-t-4 border-t-primary">
      <CardHeader>
        <div className="flex items-center justify-between">
           <CardTitle className="text-lg flex items-center gap-2">
             {isCompliant ? <ShieldCheck className="text-green-600" /> : <ShieldAlert className="text-amber-500" />}
             Legal Readiness
           </CardTitle>
           <Badge variant={isCompliant ? 'default' : 'destructive'}>{data.overallStatus}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
         
         <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Risk Score (100 is Best)</span>
              <span className="font-bold">{data.riskScore}/100</span>
            </div>
            <Progress value={data.riskScore} className="h-2" />
         </div>

         <div className="space-y-3">
            {data.violations.length === 0 && (
               <div className="flex gap-2 items-center text-green-700 bg-green-50 p-3 rounded text-sm">
                 <CheckCircle2 className="h-4 w-4" />
                 <span>Will appears legally valid.</span>
               </div>
            )}

            {data.violations.map((v, i) => (
               <div key={i} className="flex gap-2 items-start text-red-700 bg-red-50 p-3 rounded text-sm border border-red-100">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-xs mb-1">{v.code}</span>
                    {v.message}
                  </div>
               </div>
            ))}
         </div>

         {data.recommendations.length > 0 && (
            <div className="bg-slate-50 p-3 rounded">
               <h4 className="text-xs font-bold uppercase text-slate-500 mb-2 flex items-center gap-1">
                 <FileText className="h-3 w-3" /> Suggestions
               </h4>
               <ul className="list-disc pl-4 space-y-1">
                 {data.recommendations.map((rec, i) => (
                    <li key={i} className="text-xs text-slate-700">{rec}</li>
                 ))}
               </ul>
            </div>
         )}
      </CardContent>
    </Card>
  );
}