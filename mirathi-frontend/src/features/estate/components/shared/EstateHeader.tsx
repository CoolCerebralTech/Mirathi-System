import React from 'react';
import { differenceInDays } from 'date-fns';
import { 
  Building2, 
  Calendar, 
  MoreVertical, 
  Lock, 
  Unlock, 
  Archive 
} from 'lucide-react';

import { 
  Button, 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger,
  DropdownMenuLabel
} from '@/components/ui';
import { EstateStatusBadge } from './EstateStatusBadge';
import { useFreezeEstate, useUnfreezeEstate } from '../../estate.api';
import { type EstateDashboardResponse } from '@/types/estate.types';

interface EstateHeaderProps {
  estate: EstateDashboardResponse;
}

export const EstateHeader: React.FC<EstateHeaderProps> = ({ estate }) => {
  const { mutate: freeze } = useFreezeEstate(estate.id);
  const { mutate: unfreeze } = useUnfreezeEstate(estate.id);

  const daysPassed = differenceInDays(new Date(), new Date(estate.dateOfDeath));

  return (
    <div className="flex flex-col gap-4 border-b bg-white p-6 pb-8 md:flex-row md:items-start md:justify-between">
      
      {/* Left: Identity & Context */}
      <div className="flex items-start gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-lg border bg-slate-50 text-slate-400 shadow-sm">
          <Building2 className="h-8 w-8" />
        </div>
        
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {estate.name}
            </h1>
            <EstateStatusBadge status={estate.status} isFrozen={estate.isFrozen} />
          </div>
          
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <div className="flex items-center gap-1">
              <span className="font-medium text-slate-700">Deceased:</span> 
              {estate.deceasedName}
            </div>
            <div className="hidden h-4 w-px bg-slate-300 sm:block" />
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>
                Passed {new Date(estate.dateOfDeath).toLocaleDateString()} 
                <span className="ml-1 text-slate-400">({daysPassed} days ago)</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
         {/* Context Menu for Administrative Actions */}
         <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline">
                    Actions <MoreVertical className="ml-2 h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Estate Administration</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {estate.isFrozen ? (
                    <DropdownMenuItem onClick={() => unfreeze({ reason: 'Admin Request', resolutionReference: 'Manual' })}>
                        <Unlock className="mr-2 h-4 w-4 text-green-600" /> Unfreeze Estate
                    </DropdownMenuItem>
                ) : (
                    <DropdownMenuItem onClick={() => freeze({ reason: 'Admin Request' })}>
                        <Lock className="mr-2 h-4 w-4 text-amber-600" /> Freeze Estate
                    </DropdownMenuItem>
                )}
                
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600 focus:text-red-600">
                    <Archive className="mr-2 h-4 w-4" /> Close Estate
                </DropdownMenuItem>
            </DropdownMenuContent>
         </DropdownMenu>

         <Button>Generate Report</Button>
      </div>
    </div>
  );
};