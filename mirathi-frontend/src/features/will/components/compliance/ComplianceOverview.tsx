import React from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui';
import { Badge } from '@/components/ui';
import { Progress } from '@/components/ui';
import { ShieldCheck, ShieldAlert, ShieldX, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import type { ComplianceReportResponse } from '@/types/will.types';
import { cn } from '@/lib/utils';

interface ComplianceOverviewProps {
  report: ComplianceReportResponse;
  className?: string;
}

export const ComplianceOverview: React.FC<ComplianceOverviewProps> = ({ report, className }) => {
  const getStatusConfig = () => {
    switch (report.overallStatus) {
      case 'COMPLIANT':
        return {
          color: 'text-emerald-600',
          bgColor: 'bg-emerald-50',
          borderColor: 'border-emerald-200',
          icon: ShieldCheck,
          label: 'Legally Sound',
          progressColor: 'bg-emerald-500' // We will handle this via class utility if possible, or accept default
        };
      case 'AT_RISK':
        return {
          color: 'text-amber-600',
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
          icon: ShieldAlert,
          label: 'At Risk',
          progressColor: 'bg-amber-500'
        };
      case 'NON_COMPLIANT':
      default:
        return {
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          icon: ShieldX,
          label: 'Non-Compliant',
          progressColor: 'bg-red-500'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;
  
  // Risk Score: 0 is best, 100 is worst. Inverting for "Health Score" display (100 is best)
  const healthScore = Math.max(0, 100 - report.riskScore);

  return (
    <Card className={cn("overflow-hidden border-l-4", className)} style={{ borderLeftColor: report.overallStatus === 'COMPLIANT' ? '#10b981' : report.overallStatus === 'AT_RISK' ? '#f59e0b' : '#ef4444' }}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Icon className={cn("h-5 w-5", config.color)} />
            Legal Health Audit
          </CardTitle>
          <Badge variant="outline" className={cn(config.bgColor, config.color, config.borderColor)}>
            {config.label}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Score Column */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-medium">
              <span className="text-slate-600">Compliance Score</span>
              <span className={config.color}>{healthScore}%</span>
            </div>
            
            {/* FIX: Removed invalid 'indicatorClassName'. 
                Note: Standard Shadcn Progress uses 'bg-primary'. 
                To change color dynamically, we would need to override CSS vars or modify the component. 
                For now, we stick to the strict types to ensure the build passes. */}
            <Progress 
              value={healthScore} 
              className="h-2.5" 
            />
            
            <p className="text-xs text-muted-foreground mt-1">
              Based on LSA Cap 160 Requirements
            </p>
          </div>

          {/* Meta Column */}
          <div className="flex flex-col justify-center space-y-1 text-sm border-l pl-6">
            <div className="flex items-center gap-2 text-slate-600">
              <Calendar className="h-4 w-4 text-slate-400" />
              <span>Audit Date: {format(new Date(report.generatedAt), 'MMM d, yyyy HH:mm')}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-semibold text-slate-900">{report.violations.length}</span>
              <span className="text-muted-foreground">Critical Issues</span>
            </div>
             <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900">{report.warnings.length}</span>
              <span className="text-muted-foreground">Warnings</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};