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
  UserCheck
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui';
import type { WitnessSummary } from '@/types/will.types';
import { WitnessStatusBadge } from './WitnessStatusBadge';

interface WitnessCardProps {
  data: WitnessSummary;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const WitnessCard: React.FC<WitnessCardProps> = ({ 
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

  const isSigned = data.status === 'SIGNED' || data.status === 'EXECUTED';

  return (
    <Card className="group transition-all hover:shadow-md border-slate-200">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border bg-indigo-50 text-indigo-700">
            <AvatarFallback>
              {getInitials(data.name)}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <h3 className="font-semibold text-slate-900 leading-none">
              {data.name}
            </h3>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
               <UserCheck className="h-3.5 w-3.5" />
               <span>{data.type.replace(/_/g, ' ')}</span>
            </div>
          </div>
        </div>

        {/* Actions Menu - Disabled if already signed to prevent tampering */}
        {!isSigned && (
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
        )}
      </CardHeader>

      <CardContent className="pt-2">
        <div className="flex justify-between items-center border-t pt-3 mt-1">
           <span className="text-xs text-slate-500 font-medium">Attestation Status</span>
           <WitnessStatusBadge status={data.status} signedAt={data.signedAt} />
        </div>
      </CardContent>
    </Card>
  );
};