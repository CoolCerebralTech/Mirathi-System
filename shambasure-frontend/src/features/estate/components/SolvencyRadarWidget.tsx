import { Gauge, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { useSolvencyRadar } from '../estate.api';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Progress } from '../../../components/ui/Progress';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';

export function SolvencyRadarWidget({ estateId }: { estateId: string }) {
  const { data, isLoading } = useSolvencyRadar(estateId);

  if (isLoading) return <LoadingSpinner />;
  if (!data) return null;

  const isSolvent = data.netPosition.amount >= 0;

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Gauge className="h-5 w-5" /> Solvency Radar
          </CardTitle>
          <div className={`px-2 py-1 rounded text-xs font-bold ${
            data.riskLevel === 'LOW' ? 'bg-green-100 text-green-700' : 
            data.riskLevel === 'CRITICAL' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
          }`}>
            {data.riskLevel} RISK
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Main Net Position */}
        <div className="text-center py-4 bg-slate-50 rounded-lg">
          <p className="text-sm text-muted-foreground mb-1">Estimated Net Estate Value</p>
          <p className={`text-3xl font-bold ${isSolvent ? 'text-slate-900' : 'text-red-600'}`}>
            {data.netPosition.formatted}
          </p>
          {isSolvent ? (
            <div className="flex items-center justify-center text-green-600 text-xs mt-1">
              <TrendingUp className="h-3 w-3 mr-1" /> Solvent
            </div>
          ) : (
             <div className="flex items-center justify-center text-red-600 text-xs mt-1">
              <TrendingDown className="h-3 w-3 mr-1" /> Insolvent (Bankrupt)
            </div>
          )}
        </div>

        {/* Health Score */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span>Financial Health Score</span>
            <span className="font-bold">{data.healthScore}/100</span>
          </div>
          <Progress value={data.healthScore} className="h-2" />
        </div>

        {/* Liquidity Alerts */}
        {data.alerts.length > 0 && (
          <div className="bg-amber-50 border border-amber-100 rounded p-3">
             <div className="flex items-center gap-2 mb-2 text-amber-800 font-semibold text-xs">
               <AlertTriangle className="h-3 w-3" /> Action Required
             </div>
             <ul className="list-disc pl-4 space-y-1">
               {data.alerts.map((alert, i) => (
                 <li key={i} className="text-xs text-amber-700">{alert}</li>
               ))}
             </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}