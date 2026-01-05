// FILE: src/features/family/components/HeirsOverview.tsx

import React from 'react';
import { Scroll, Info, AlertTriangle } from 'lucide-react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  CardDescription,
  Badge,
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
  Button
} from '@/components/ui';
import { usePotentialHeirs } from '../family.api';
import type { PotentialHeir } from '@/types/family.types';

export const HeirsOverview: React.FC<{ familyId: string }> = ({ familyId }) => {
  const { data, isLoading } = usePotentialHeirs(familyId);

  if (isLoading) return <div className="h-32 rounded-lg bg-slate-100 animate-pulse" />;
  
  if (!data || data.heirs.length === 0) {
    return (
      <Card className="bg-slate-50 border-dashed">
        <CardContent className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
          <Scroll className="mb-2 h-8 w-8 opacity-50" />
          <p>No heirs identified yet. Add family members to see succession analysis.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Potential Heirs
          <Badge variant="outline" className="font-normal text-xs">Intestate</Badge>
        </CardTitle>
        <CardDescription>
          Based on Law of Succession Act (Cap 160)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.heirs.map((heir) => (
          <HeirRow key={heir.id} heir={heir} />
        ))}

        <div className="mt-4 rounded-md bg-blue-50 p-3 text-xs text-blue-800 flex gap-2">
          <Info className="h-4 w-4 shrink-0" />
          <p>{data.disclaimer}</p>
        </div>
      </CardContent>
    </Card>
  );
};

const HeirRow: React.FC<{ heir: PotentialHeir }> = ({ heir }) => {
  const isWarning = heir.category === 'WARNING';

  return (
    <div className={`flex items-start justify-between rounded-lg border p-3 ${isWarning ? 'bg-amber-50 border-amber-200' : 'bg-white'}`}>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
           <span className="font-medium text-sm">{heir.name}</span>
           {heir.house && <Badge variant="secondary" className="text-[10px]">{heir.house}</Badge>}
        </div>
        
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
           <Badge variant={isWarning ? "destructive" : "secondary"} className="text-[10px] h-5">
             {heir.category}
           </Badge>
           <span>Priority: {heir.priority}</span>
        </div>
      </div>

      <HoverCard>
        <HoverCardTrigger asChild>
          {/* 2. CHANGE lowercase 'button' TO uppercase 'Button' */}
          <Button variant="ghost" size="icon" className="h-6 w-6">
            {isWarning ? <AlertTriangle className="h-4 w-4 text-amber-600" /> : <Info className="h-4 w-4 text-slate-400" />}
          </Button>
        </HoverCardTrigger>
        <HoverCardContent className="w-80">
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">{heir.legalBasis}</h4>
            <p className="text-sm text-muted-foreground">
              {heir.description}
            </p>
          </div>
        </HoverCardContent>
      </HoverCard>
    </div>
  );
};