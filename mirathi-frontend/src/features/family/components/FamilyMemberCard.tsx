import React from 'react';
import { MoreHorizontal, CheckCircle2 } from 'lucide-react';

import { 
  Card, 
  Button, 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui';
import { Avatar, AvatarFallback } from '@/components/common';
import { LegalStatusBadge } from './LegalStatusBadge';
import { type FamilyMemberResponse } from '@/types/family.types';

interface FamilyMemberCardProps {
  member: FamilyMemberResponse;
  onEdit?: (id: string) => void;
  onVerify?: (id: string) => void;
  onAddRelative?: (id: string) => void;
}

export const FamilyMemberCard: React.FC<FamilyMemberCardProps> = ({
  member,
  onEdit,
  onVerify,
  onAddRelative,
}) => {
  const { identity, vitalStatus, legalStatus, verification, polygamyContext } = member;

  const initials = `${identity.first[0]}${identity.last[0]}`;

  return (
    <Card className="flex items-center justify-between p-4 transition-all hover:shadow-md">
      <div className="flex items-center gap-4">
        {/* Avatar with Status Indicator */}
        <div className="relative">
          <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
            <AvatarFallback className={vitalStatus.isAlive ? 'bg-primary/10 text-primary' : 'bg-slate-200 text-slate-500'}>
              {initials}
            </AvatarFallback>
          </Avatar>
          {verification.isVerified && (
            <div className="absolute -bottom-1 -right-1 rounded-full bg-white p-0.5">
              <CheckCircle2
                className="h-4 w-4 text-white bg-green-500 rounded-full"
                fill="currentColor"
              />
            </div>
           )}
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">
              {identity.fullName}
            </span>
            {!vitalStatus.isAlive && (
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 uppercase">
                Deceased
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="capitalize">{identity.gender.toLowerCase()}</span>
            <span>•</span>
            <span>{identity.age ? `${identity.age} years` : 'Age unknown'}</span>
            {polygamyContext.isPolygamousFamily && polygamyContext.belongsToHouseName && (
               <>
                 <span>•</span>
                 <span className="text-purple-600">{polygamyContext.belongsToHouseName}</span>
               </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <LegalStatusBadge status={legalStatus} className="hidden md:inline-flex" />
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit?.(member.id)}>
              View Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAddRelative?.(member.id)}>
              Add Relative
            </DropdownMenuItem>
            {!verification.isVerified && (
               <DropdownMenuItem onClick={() => onVerify?.(member.id)}>
                 Verify Identity
               </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  );
};