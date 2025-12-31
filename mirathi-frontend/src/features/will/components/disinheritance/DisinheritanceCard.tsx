import React from 'react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  CardFooter 
} from '@/components/ui';
import { Button } from '@/components/ui';
import { Badge } from '@/components/ui';
import { 
  UserMinus, 
  AlertTriangle, 
  ShieldAlert, 
  Edit, 
  Trash2 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DisinheritanceSummary } from '@/types/will.types';

interface DisinheritanceCardProps {
  data: DisinheritanceSummary;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  className?: string;
}

export const DisinheritanceCard: React.FC<DisinheritanceCardProps> = ({ 
  data, 
  onEdit, 
  onDelete, 
  className 
}) => {
  // Color coding based on Risk Level (High risk usually means S.26 dependency claim is likely)
  const getRiskConfig = (level: string) => {
    switch (level) {
      case 'HIGH':
        return {
          borderColor: 'border-l-red-500',
          badgeColor: 'bg-red-100 text-red-800 border-red-200',
          icon: ShieldAlert
        };
      case 'MEDIUM':
        return {
          borderColor: 'border-l-amber-500',
          badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
          icon: AlertTriangle
        };
      default:
        return {
          borderColor: 'border-l-slate-300',
          badgeColor: 'bg-slate-100 text-slate-800 border-slate-200',
          icon: UserMinus
        };
    }
  };

  const config = getRiskConfig(data.riskLevel);
  const RiskIcon = config.icon;

  return (
    <Card className={cn("border-l-4 transition-all hover:shadow-sm", config.borderColor, className)}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
               <UserMinus className="h-5 w-5 text-slate-500" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-slate-900">
                {data.personName}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                  {data.reasonCategory.replace(/_/g, ' ')}
                </span>
                {!data.isActive && (
                    <Badge variant="secondary" className="text-[10px] h-4">Archived</Badge>
                )}
              </div>
            </div>
          </div>
          
          <Badge variant="outline" className={cn("gap-1", config.badgeColor)}>
            <RiskIcon className="h-3 w-3" />
            {data.riskLevel} RISK
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pb-3 text-sm text-slate-600">
        <p>
          Disinherited from estate. 
          {data.riskLevel === 'HIGH' && (
            <span className="block mt-1 text-red-600 font-medium text-xs">
              Warning: High probability of court challenge under S.26 LSA.
            </span>
          )}
        </p>
      </CardContent>

      <CardFooter className="flex justify-end gap-2 pt-0">
        {onEdit && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onEdit(data.id)}
            className="h-8 w-8 p-0 text-slate-500"
          >
            <Edit className="h-4 w-4" />
            <span className="sr-only">Edit</span>
          </Button>
        )}
        {onDelete && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onDelete(data.id)}
            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Remove</span>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};