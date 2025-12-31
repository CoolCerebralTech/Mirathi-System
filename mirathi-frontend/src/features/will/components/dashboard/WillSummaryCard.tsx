import React from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter // Added missing import
} from '@/components/ui';
import { Button } from '@/components/ui';
import { 
  PenTool, 
  ShieldCheck, 
  FileText, 
  AlertTriangle, 
  ArrowRight 
} from 'lucide-react';
import { WillStatusBadge } from '@/features/will/components/shared/WillStatusBadge';
import { WillTypeBadge } from '@/features/will/components/shared/WillTypeBadge';
import type { WillSummaryResponse } from '@/types/will.types';
import { useNavigate } from 'react-router-dom';

interface WillSummaryCardProps {
  will: WillSummaryResponse;
  onViewDetails?: (id: string) => void;
}

export const WillSummaryCard: React.FC<WillSummaryCardProps> = ({ will, onViewDetails }) => {
  const navigate = useNavigate();

  const handleView = () => {
    if (onViewDetails) {
      onViewDetails(will.id);
    } else {
      navigate(`/dashboard/will/${will.id}`);
    }
  };

  const isDraft = will.status === 'DRAFT';
  const isRevoked = will.isRevoked;
  const hasValidationErrors = will.validationErrorsCount > 0;

  return (
    <Card className="group relative flex flex-col justify-between overflow-hidden border-l-4 transition-all hover:shadow-md">
      {/* Dynamic border color based on status/risk */}
      <div 
        className={`absolute top-0 left-0 h-full w-2.5 ${
          isRevoked ? 'bg-red-500' :
          hasValidationErrors ? 'bg-amber-500' :
          isDraft ? 'bg-blue-500' :
          'bg-emerald-500'
        }`}
      />

      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-bold leading-tight">
            Last Will & Testament
          </CardTitle>
          <WillStatusBadge status={will.status} />
        </div>
        <CardDescription className="text-xs text-muted-foreground flex items-center gap-2">
          {will.executionDate ? (
            <>
              <FileText className="h-3 w-3" /> Executed: {new Date(will.executionDate).toLocaleDateString()}
            </>
          ) : (
            <>
              <PenTool className="h-3 w-3" /> Drafted: {new Date(will.createdAt).toLocaleDateString()}
            </>
          )}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pb-4 text-sm space-y-2">
        <WillTypeBadge type={will.type} />

        <div className="flex items-center gap-2 text-xs text-slate-500">
           {isRevoked ? (
             <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
           ) : hasValidationErrors ? (
             <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
           ) : (
             <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
           )}
           {isRevoked ? 'Will Revoked' : hasValidationErrors ? `${will.validationErrorsCount} Validation Issues` : 'Status: Valid'}
        </div>
        
        <p className="text-muted-foreground text-xs line-clamp-2">
          {will.hasCodicils ? 'Contains amendments.' : ''} {will.hasDisinheritance ? 'Includes disinheritance records.' : ''}
        </p>
      </CardContent>

      <CardFooter className="pt-0">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleView}
          className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 -ml-2 w-full justify-start"
        >
          <ArrowRight className="mr-2 h-4 w-4" />
          View Will Details
        </Button>
      </CardFooter>
    </Card>
  );
};