import React from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter
} from '@/components/ui';
import { Button } from '@/components/ui';
import { Badge } from '@/components/ui';
import { 
  GitCommit, 
  GitPullRequest, 
  Trash2, 
  Edit, 
  CheckCircle2, 
  Clock, 
  FileEdit
} from 'lucide-react';
import { format } from 'date-fns';
import type { CodicilSummary } from '@/types/will.types';
import { CodicilAmendmentType } from '@/types/will.types';
import { cn } from '@/lib/utils';

interface CodicilCardProps {
  data: CodicilSummary;
  onView?: (id: string) => void;
  onDelete?: (id: string) => void; // Only allowed if not executed
  className?: string;
}

export const CodicilCard: React.FC<CodicilCardProps> = ({ 
  data, 
  onView, 
  onDelete,
  className 
}) => {
  // Helper to determine visual style based on amendment type
  const getTypeConfig = (type: string) => {
    switch (type) {
      case CodicilAmendmentType.ADDITION:
        return { 
          icon: GitCommit, 
          label: 'Addition', 
          color: 'text-emerald-600 bg-emerald-50 border-emerald-200' 
        };
      case CodicilAmendmentType.REVOCATION:
        return { 
          icon: Trash2, 
          label: 'Revocation', 
          color: 'text-red-600 bg-red-50 border-red-200' 
        };
      case CodicilAmendmentType.MODIFICATION:
      default:
        return { 
          icon: FileEdit, 
          label: 'Modification', 
          color: 'text-blue-600 bg-blue-50 border-blue-200' 
        };
    }
  };

  const typeConfig = getTypeConfig(data.type);
  const TypeIcon = typeConfig.icon;

  return (
    <Card className={cn("transition-all hover:shadow-sm", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <GitPullRequest className="h-4 w-4 text-slate-500" />
              {data.title}
            </CardTitle>
            <CardDescription>
              {format(new Date(data.date), 'MMMM d, yyyy')}
            </CardDescription>
          </div>
          
          <Badge variant="outline" className={typeConfig.color}>
            <TypeIcon className="mr-1 h-3 w-3" />
            {typeConfig.label}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pb-3">
        <div className="flex items-center gap-2">
            {data.isExecuted ? (
              <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                <CheckCircle2 className="mr-1 h-3 w-3 text-emerald-600" />
                Executed
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-amber-50 text-amber-700">
                <Clock className="mr-1 h-3 w-3" />
                Draft
              </Badge>
            )}
        </div>
      </CardContent>

      <CardFooter className="pt-0 flex justify-end gap-2">
        {onView && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onView(data.id)}
            className="text-slate-600"
          >
            <Edit className="mr-2 h-3.5 w-3.5" />
            View
          </Button>
        )}
        
        {!data.isExecuted && onDelete && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onDelete(data.id)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="mr-2 h-3.5 w-3.5" />
            Delete
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};