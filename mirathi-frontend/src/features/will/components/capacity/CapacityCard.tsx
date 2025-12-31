import React from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from '@/components/ui';
import { Button } from '@/components/ui';
import { CapacityRiskBadge } from './CapacityRiskBadge';
import type { CapacityDeclarationSummary } from '@/types/will.types';
import { CapacityStatus } from '@/types/will.types';
import { BrainCircuit, Calendar, FileCheck, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

interface CapacityCardProps {
  data?: CapacityDeclarationSummary;
  onUpdate?: () => void;
  className?: string;
}

export const CapacityCard: React.FC<CapacityCardProps> = ({ 
  data, 
  onUpdate,
  className 
}) => {
  // Helpers to format display text
  const formatStatus = (status: string) => {
    return status
      .split('_')
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case CapacityStatus.ASSESSED_COMPETENT:
      case CapacityStatus.MEDICAL_CERTIFICATION:
        return 'text-emerald-700 bg-emerald-50';
      case CapacityStatus.ASSESSED_INCOMPETENT:
        return 'text-red-700 bg-red-50';
      case CapacityStatus.PENDING_ASSESSMENT:
        return 'text-amber-700 bg-amber-50';
      default:
        return 'text-slate-700 bg-slate-50';
    }
  };

  if (!data) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BrainCircuit className="h-5 w-5 text-slate-500" />
            Mental Capacity
          </CardTitle>
          <CardDescription>
            Section 5 of the LSA requires the testator to be of sound mind.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <AlertTriangle className="h-10 w-10 text-amber-500 mb-3" />
            <h4 className="font-medium text-slate-900">Capacity Not Declared</h4>
            <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-xs">
              Without a capacity declaration, this Will is at high risk of being contested.
            </p>
            {onUpdate && (
              <Button onClick={onUpdate} variant="outline">
                Declare Capacity
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BrainCircuit className="h-5 w-5 text-indigo-600" />
              Mental Capacity Status
            </CardTitle>
            <CardDescription className="mt-1">
              Legal soundness assessment
            </CardDescription>
          </div>
          <CapacityRiskBadge level={data.riskLevel} />
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* Status Banner */}
          <div className={`flex items-center justify-between p-3 rounded-md ${getStatusColor(data.status)}`}>
            <span className="font-medium text-sm">
              {formatStatus(data.status)}
            </span>
            {data.isLegallySufficient && (
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider">
                <FileCheck className="h-3.5 w-3.5" />
                Legally Sufficient
              </div>
            )}
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground text-xs uppercase tracking-wide">Last Assessment</span>
              <div className="flex items-center gap-2 text-slate-700">
                <Calendar className="h-3.5 w-3.5" />
                <span className="font-medium">
                  {format(new Date(data.date), 'MMM d, yyyy')}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground text-xs uppercase tracking-wide">Documentation</span>
              <div className="flex items-center gap-2 text-slate-700">
                <span className="font-medium">
                  {data.status === 'SELF_DECLARATION' ? 'Self-Attested' : 'Verified Document'}
                </span>
              </div>
            </div>
          </div>

          {onUpdate && (
            <Button 
              onClick={onUpdate} 
              variant="ghost" 
              className="w-full text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 -ml-2 justify-start h-auto py-2"
            >
              Update Assessment Status
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};