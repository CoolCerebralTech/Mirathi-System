import { User, CheckCircle2, XCircle, AlertTriangle, Baby } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Avatar } from '../../../components/common/Avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../../components/ui/Tooltip';

import type { FamilyMemberResponse } from '../family.types';
import { AddMemberDialog } from './AddMemberDialog';

interface FamilyMemberCardProps {
  member: FamilyMemberResponse; // Uses the full DTO
  isFocused?: boolean;
}

export function FamilyMemberCard({ member, isFocused }: FamilyMemberCardProps) {
  const { t } = useTranslation();
  
  const initials = `${member.identity.first[0]}${member.identity.last[0]}`;
  const isDeceased = !member.vitalStatus.isAlive;
  const isMinor = member.legalStatus.isMinor;

  return (
    <Card className={`
      relative overflow-hidden transition-all duration-200 hover:shadow-md
      ${isFocused ? 'ring-2 ring-primary ring-offset-2' : ''}
      ${isDeceased ? 'bg-slate-50 opacity-90' : 'bg-white'}
    `}>
      {/* Vital Status Strip */}
      {isDeceased && (
        <div className="absolute top-0 left-0 w-full h-1 bg-neutral-500" title="Deceased" />
      )}
      
      <div className="p-4 flex items-start gap-4">
        {/* Avatar Section */}
        <div className="relative">
          <Avatar 
            fallback={initials} 
            className={`h-12 w-12 ${isDeceased ? 'grayscale' : ''}`} 
          />
          
          {/* Verification Badge */}
          <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
            {member.verification.isVerified ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <CheckCircle2 className="h-4 w-4 text-green-600 fill-green-100" />
                  </TooltipTrigger>
                  <TooltipContent>Identity Verified ({member.verification.method})</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  </TooltipTrigger>
                  <TooltipContent>Identity Not Verified</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>

        {/* Info Section */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className={`font-medium truncate ${isDeceased ? 'text-muted-foreground line-through' : ''}`}>
              {member.identity.fullName}
            </h4>
            {isMinor && <Baby className="h-4 w-4 text-blue-500" />}
          </div>

          <div className="flex flex-wrap gap-1 mt-1">
             {/* Dynamic Badges based on DTO */}
             {member.polygamyContext.isHouseHead && (
               <Badge variant="outline" className="text-[10px] px-1 h-5">Head of House</Badge>
             )}
             {member.legalStatus.inheritanceEligibility === 'PENDING_VERIFICATION' && (
               <Badge variant="destructive" className="text-[10px] px-1 h-5">Eligibility Pending</Badge>
             )}
          </div>
          
          <div className="mt-3 flex gap-2">
            <AddMemberDialog 
               familyId={member.familyId} 
               anchorMemberId={member.id} 
               anchorMemberName={member.identity.first} 
            />
            
            <Button variant="ghost" size="sm" className="h-8 text-xs">
              View Profile
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}