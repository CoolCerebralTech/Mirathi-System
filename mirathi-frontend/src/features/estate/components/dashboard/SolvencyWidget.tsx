// components/dashboard/SolvencyWidget.tsx

import React from 'react';
import { 
  Radar, 
  AlertTriangle, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { Badge } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { SolvencyRadarResponse } from '@/types/estate.types';

interface SolvencyWidgetProps {
  radar: SolvencyRadarResponse;
}

export const SolvencyWidget: React.FC<SolvencyWidgetProps> = ({ radar }) => {
  // Data is now passed as a prop, no internal loading state needed here
  const data = radar;

  if (!data) {
    return (
      <Card className="h-full border-red-200 bg-red-50">
        <CardContent className="flex h-full flex-col items-center justify-center p-6 text-red-600">
          <AlertCircle className="mb-2 h-8 w-8" />
          <p className="text-sm font-medium">Analysis Unavailable</p>
        </CardContent>
      </Card>
    );
  }

  const riskColors: Record<string, string> = {
    LOW: "bg-emerald-100 text-emerald-800 border-emerald-200",
    MEDIUM: "bg-blue-100 text-blue-800 border-blue-200",
    HIGH: "bg-amber-100 text-amber-800 border-amber-200",
    CRITICAL: "bg-red-100 text-red-800 border-red-200",
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600";
    if (score >= 50) return "text-amber-600";
    return "text-red-600";
  };

  return (
    <Card className="h-full shadow-sm flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Radar className="h-5 w-5 text-slate-500" />
            Solvency Radar
          </CardTitle>
          <Badge variant="outline" className={cn("font-bold tracking-wide", riskColors[data.riskLevel])}>
            {data.riskLevel} RISK
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-6 pt-4">
        {/* Score & Ratio Row */}
        <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col items-center justify-center">
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full border-4 border-slate-100 bg-white shadow-inner">
                    <span className={cn("text-2xl font-bold", getScoreColor(data.healthScore))}>
                    {data.healthScore}
                    </span>
                    <span className="absolute -bottom-2 bg-white px-1 text-[10px] font-bold text-slate-400">
                    SCORE
                    </span>
                </div>
            </div>

            <div className="flex-1 rounded-lg border bg-slate-50 p-3 text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center justify-center gap-1">
                    <TrendingUp className="h-3 w-3" /> Liquidity Ratio
                </p>
                <p className="text-lg font-bold text-slate-800">
                    {data.liquidityAnalysis.liquidityRatio.toFixed(2)}x
                </p>
                <p className="text-[10px] text-slate-500">
                    (Cash / Immediate Debt)
                </p>
            </div>
        </div>

        {/* Alerts List */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-slate-500 uppercase">Analysis Alerts</h4>
          {data.alerts.length === 0 ? (
            <div className="flex items-center gap-2 rounded-md bg-emerald-50 p-3 text-xs text-emerald-700 border border-emerald-100">
              <CheckCircle2 className="h-4 w-4" />
              <span>No immediate solvency issues detected.</span>
            </div>
          ) : (
            <ul className="space-y-2">
              {data.alerts.slice(0, 3).map((alert, index) => (
                <li key={index} className="flex items-start gap-2 text-xs text-slate-700 bg-amber-50/50 p-2 rounded border border-amber-100">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span>{alert}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
};