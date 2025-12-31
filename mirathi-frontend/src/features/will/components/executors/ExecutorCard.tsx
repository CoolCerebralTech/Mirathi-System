import React from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader 
} from '@/components/ui';
import { Button } from '@/components/ui';
import { Avatar, AvatarFallback } from '@/components/common';
import { 
  MoreVertical, 
  Edit2, 
  Trash2,
  Mail,
  Phone
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui';
import type { ExecutorSummary } from '@/types/will.types';
import { ExecutorPriorityBadge } from './ExecutorPriorityBadge';
import { QualificationStatus } from './QualificationStatus';

interface ExecutorCardProps {
  data: ExecutorSummary;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const ExecutorCard: React.FC<ExecutorCardProps> = ({ 
  data, 
  onEdit, 
  onDelete 
}) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <Card className="group transition-all hover:shadow-md border-slate-200">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 border-2 border-white shadow-sm bg-slate-100">
            <AvatarFallback className="text-slate-600 font-semibold">
              {getInitials(data.name)}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <h3 className="font-semibold text-slate-900 leading-none">
              {data.name}
            </h3>
            <QualificationStatus 
              isQualified={data.isQualified} 
              statusText={data.status} 
            />
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

      <CardContent>
        <div className="flex flex-col gap-3">
          <ExecutorPriorityBadge priority={data.priority} />
          
          <div className="flex flex-col gap-1.5 pt-1">
             {/* Note: Ideally contact info comes from API, assuming placeholders if not in summary */}
             <div className="flex items-center gap-2 text-xs text-slate-500">
               <Mail className="h-3.5 w-3.5" />
               <span className="truncate">executor@email.com</span>
             </div>
             <div className="flex items-center gap-2 text-xs text-slate-500">
               <Phone className="h-3.5 w-3.5" />
               <span>+254 7XX XXX XXX</span>
             </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};