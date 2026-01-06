// ============================================================================
// FILE 3: HeirsOverview.tsx - UPDATED
// ============================================================================

import React from 'react';
import { Scroll, Info, AlertTriangle, Loader2 } from 'lucide-react';
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
  Button,
  Alert,
  AlertDescription,
} from '@/components/ui';
import { usePotentialHeirs } from '../family.api';
import type { PotentialHeir } from '@/types/family.types';

export const HeirsOverview: React.FC<{ familyId: string }> = ({ familyId }) => {
  const { data, isLoading, isError, error } = usePotentialHeirs(familyId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }
  
  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load heirs: {error?.message || 'Unknown error'}
        </AlertDescription>
      </Alert>
    );
  }
  
  if (!data || data.heirs.length === 0) {
    return (
      <Card className="bg-slate-50 border-dashed">
        <CardContent className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
          <Scroll className="mb-2 h-8 w-8 opacity-50" />
          <p className="text-sm">No heirs identified yet.</p>
          <p className="text-xs mt-1">Add family members to see succession analysis.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Potential Heirs
              <Badge variant="outline" className="font-normal text-xs">
                {data.regime || 'INTESTATE'}
              </Badge>
            </CardTitle>
            <CardDescription>
              Based on {data.religion || 'Kenyan'} Law of Succession Act (Cap 160)
            </CardDescription>
          </div>
          
          {data.marriageType && (
            <Badge variant="secondary">
              {data.marriageType}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Heirs List */}
        <div className="space-y-3">
          {data.heirs.map((heir) => (
            <HeirRow key={heir.id} heir={heir} />
          ))}
        </div>

        {/* Warnings */}
        {data.warnings && data.warnings.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc pl-4 space-y-1">
                {data.warnings.map((warning, idx) => (
                  <li key={idx} className="text-sm">{warning}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Legal Disclaimer */}
        <div className="mt-4 rounded-md bg-blue-50 p-3 text-xs text-blue-800 flex gap-2">
          <Info className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-medium">{data.disclaimer}</p>
            {data.legalNote && <p className="text-blue-700">{data.legalNote}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const HeirRow: React.FC<{ heir: PotentialHeir }> = ({ heir }) => {
  const isWarning = heir.category === 'WARNING';

  const getCategoryColor = () => {
    switch (heir.category) {
      case 'SPOUSE':
        return 'bg-pink-100 text-pink-700 border-pink-200';
      case 'CHILD':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'PARENT':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'SIBLING':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'WARNING':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className={cn(
      "flex items-start justify-between rounded-lg border p-3 transition-colors hover:bg-slate-50",
      isWarning ? 'bg-amber-50 border-amber-200' : 'bg-white'
    )}>
      <div className="space-y-1 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{heir.name}</span>
          
          {heir.house && (
            <Badge variant="secondary" className="text-[10px]">
              {heir.house}
              {heir.houseOrder && ` (${heir.houseOrder})`}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge className={cn("text-[10px] h-5", getCategoryColor())}>
            {heir.category}
          </Badge>
          <span>Priority: {heir.priority}</span>
          {heir.share && <span>• Share: {heir.share}</span>}
        </div>

        {heir.conditions && heir.conditions.length > 0 && (
          <div className="mt-2 text-xs text-muted-foreground">
            <span className="font-medium">Conditions:</span>
            <ul className="list-disc pl-4 mt-1">
              {heir.conditions.map((condition, idx) => (
                <li key={idx}>{condition}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <HoverCard>
        <HoverCardTrigger asChild>
          <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
            {isWarning ? (
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            ) : (
              <Info className="h-4 w-4 text-slate-400" />
            )}
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