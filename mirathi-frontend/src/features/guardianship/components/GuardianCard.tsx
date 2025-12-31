import React from 'react';
import { Phone, Shield, MoreVertical } from 'lucide-react';
import { Card, Button, Badge, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../../../components/ui';
import { type GuardianSummary } from '../../../types/guardianship.types';

interface GuardianCardProps {
  guardian: GuardianSummary;
  onSuspend?: (id: string) => void;
  onEdit?: (id: string) => void;
}

export const GuardianCard: React.FC<GuardianCardProps> = ({ guardian, onSuspend, onEdit }) => {
  return (
    <Card className="flex items-center justify-between p-4">
      <div className="flex items-center gap-4">
        <div className="rounded-full bg-slate-100 p-2 text-slate-500">
          <Shield className="h-5 w-5" />
        </div>
        <div>
            <div className="flex items-center gap-2">
                <h4 className="font-semibold">{guardian.name}</h4>
                {guardian.isPrimary && <Badge variant="secondary" className="text-[10px]">Primary</Badge>}
                {guardian.status === 'SUSPENDED' && <Badge variant="destructive" className="text-[10px]">Suspended</Badge>}
            </div>
            <p className="text-sm text-muted-foreground capitalize">
                {guardian.role.replace(/_/g, ' ').toLowerCase()} • {guardian.relationshipToWard}
            </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
         <div className="hidden text-sm text-muted-foreground sm:block">
            <div className="flex items-center gap-1">
                <Phone className="h-3 w-3" /> {guardian.contactPhone}
            </div>
         </div>
         
         <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit?.(guardian.guardianId)}>Edit Powers</DropdownMenuItem>
                <DropdownMenuItem 
                    className="text-red-600 focus:text-red-600"
                    onClick={() => onSuspend?.(guardian.guardianId)}
                >
                    Suspend Guardian
                </DropdownMenuItem>
            </DropdownMenuContent>
         </DropdownMenu>
      </div>
    </Card>
  );
};