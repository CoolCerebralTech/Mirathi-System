import React from 'react';
import { AlertOctagon, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Progress, Alert, AlertTitle, AlertDescription } from '../../../../components/ui';
import { useSolvencyRadar } from '../../../../features/estate/estate.api';
import { LoadingSpinner } from '../../../../components/common';
import { MoneyDisplay } from '../shared/MoneyDisplay';
import { cn } from '../../../../lib/utils';

interface SolvencyWidgetProps {
  estateId: string;
}

export const SolvencyWidget: React.FC<SolvencyWidgetProps> = ({ estateId }) => {
  const { data, isLoading } = useSolvencyRadar(estateId);

  if (isLoading) return <div className="h-32 flex items-center justify-center"><LoadingSpinner /></div>;
  if (!data) return null;

  const isCritical = data.riskLevel === 'CRITICAL' || data.riskLevel === 'HIGH';

  return (
    <Card className={cn("h-full", isCritical ? "border-red-200 bg-red-50/10" : "border-green-200 bg-green-50/10")}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
                {isCritical ? <AlertOctagon className="h-5 w-5 text-red-600" /> : <CheckCircle2 className="h-5 w-5 text-green-600" />}
                Solvency Radar
            </CardTitle>
            <span className={cn(
                "text-xs font-bold px-2 py-1 rounded",
                isCritical ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
            )}>
                {data.riskLevel} RISK
            </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Health Score Bar */}
        <div className="space-y-1">
            <div className="flex justify-between text-xs font-medium">
                <span>Health Score</span>
                <span>{data.healthScore}/100</span>
            </div>
            <Progress value={data.healthScore} className={cn("h-2", isCritical ? "bg-red-100 [&>div]:bg-red-500" : "bg-green-100 [&>div]:bg-green-500")} />
        </div>

        {/* Liquidity Check */}
        <div className="rounded-md border bg-background p-3 text-sm">
            <div className="flex justify-between mb-1">
                <span className="text-muted-foreground">Liquid Cash</span>
                <MoneyDisplay amount={data.liquidityAnalysis.liquidCash} />
            </div>
            <div className="flex justify-between mb-1">
                <span className="text-muted-foreground">Immediate Debts</span>
                <MoneyDisplay amount={data.liquidityAnalysis.immediateObligations} />
            </div>
            <div className="border-t mt-2 pt-2 flex justify-between font-medium">
                <span>Liquidity Gap</span>
                <MoneyDisplay 
                    amount={data.liquidityAnalysis.cashShortfall} 
                    colored 
                    className={data.liquidityAnalysis.isLiquid ? "text-green-600" : "text-red-600"} 
                />
            </div>
        </div>

        {/* Alerts */}
        {data.alerts.length > 0 && (
            <Alert variant="destructive" className="py-2">
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle className="text-xs font-semibold">Action Required</AlertTitle>
                <AlertDescription className="text-xs">
                    {data.alerts[0]}
                </AlertDescription>
            </Alert>
        )}
      </CardContent>
    </Card>
  );
};