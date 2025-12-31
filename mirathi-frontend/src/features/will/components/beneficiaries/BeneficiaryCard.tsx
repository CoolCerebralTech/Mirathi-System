import React from 'react';
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader 
} from '@/components/ui';
import { Button } from '@/components/ui';
import { Avatar, AvatarFallback } from '@/components/common';
import { 
  MoreVertical, 
  AlertTriangle, 
  Edit2, 
  Trash2 
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui';
import type { BequestSummary } from '@/types/will.types';
import { BequestTypeBadge } from './BequestTypeBadge';
import { BequestBreakdown } from './BequestBreakdown';

interface BeneficiaryCardProps {
  data: BequestSummary;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const BeneficiaryCard: React.FC<BeneficiaryCardProps> = ({ 
  data, 
  onEdit, 
  onDelete 
}) => {
  // Get initials for Avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <Card className="group relative overflow-hidden transition-all hover:shadow-md border-slate-200">
      {/* Risk Indicator Strip */}
      {data.riskLevel !== 'LOW' && (
        <div className={`absolute left-0 top-0 h-full w-1 ${
          data.riskLevel === 'HIGH' ? 'bg-red-500' : 'bg-amber-400'
        }`} />
      )}

      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 pl-6">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border bg-slate-100">
            <AvatarFallback className="text-slate-600">
              {getInitials(data.beneficiaryName)}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-0.5">
            <h3 className="font-semibold text-slate-900 leading-none">
              {data.beneficiaryName}
            </h3>
            {/* Note: The BequestSummary type provided in prompts didn't explicitly have 'relationship' 
                but typically it's needed. Using description for now or assuming the API updates. */}
            <p className="text-xs text-muted-foreground">Beneficiary</p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-slate-400">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit?.(data.id)}>
              <Edit2 className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onDelete?.(data.id)}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="pl-6 pb-3">
        <div className="mb-4">
          <BequestTypeBadge type={data.type} className="mb-2" />
          <p className="text-sm text-slate-600 line-clamp-2 min-h-[40px]">
            {data.description}
          </p>
        </div>

        <BequestBreakdown 
          valueSummary={data.valueSummary} 
          type={data.type} 
        />
      </CardContent>

      {/* Footer for Warnings */}
      {data.riskLevel !== 'LOW' && (
        <CardFooter className="bg-red-50/50 px-6 py-2">
          <div className="flex items-center gap-2 text-xs text-red-700 font-medium">
            <AlertTriangle className="h-3 w-3" />
            {data.riskLevel === 'HIGH' ? 'High Risk: Disinheritance likely' : 'Review suggested'}
          </div>
        </CardFooter>
      )}
    </Card>
  );
};