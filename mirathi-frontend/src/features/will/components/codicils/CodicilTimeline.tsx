import React from 'react';
import type { CodicilSummary } from '@/types/will.types';
import { CodicilCard } from './CodicilCard';
import { Scroll, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/common';
import { Button } from '@/components/ui';

interface CodicilTimelineProps {
  codicils: CodicilSummary[];
  onView: (id: string) => void;
  onAdd?: () => void;
  loading?: boolean;
  className?: string;
}

export const CodicilTimeline: React.FC<CodicilTimelineProps> = ({
  codicils,
  onView,
  onAdd,
  loading,
  className
}) => {
  if (loading) {
    return <div className="space-y-4 animate-pulse">
       <div className="h-32 bg-slate-100 rounded-xl" />
       <div className="h-32 bg-slate-100 rounded-xl" />
    </div>;
  }

  if (!codicils || codicils.length === 0) {
    return (
      <EmptyState
        icon={Scroll}
        title="No Amendments (Codicils)"
        description="The Will is currently in its original state with no registered changes."
        action={onAdd ? {
            label: "Add Codicil",
            onClick: onAdd
        } : undefined}
        className="border-dashed"
      />
    );
  }

  // Sort by date ascending (Original -> Change 1 -> Change 2)
  const sortedCodicils = [...codicils].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return (
    <div className={cn("space-y-6 relative", className)}>
       {/* Main vertical connector line */}
       <div className="absolute left-[20px] top-4 bottom-4 w-0.5 bg-slate-200 z-0" />

      {/* The Original Will Node (Visual Anchor) */}
      <div className="relative z-10 flex gap-4 opacity-70">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-slate-300 bg-slate-50 text-slate-400">
           <Scroll className="h-5 w-5" />
        </div>
        <div className="pt-2">
            <h4 className="text-sm font-semibold text-slate-700">Original Will</h4>
            <p className="text-xs text-muted-foreground">The foundational document</p>
        </div>
      </div>

      {/* Codicil Nodes */}
      {sortedCodicils.map((codicil) => (
        <div key={codicil.id} className="relative z-10 flex gap-4">
           {/* Connector Icon */}
          <div className="flex flex-col items-center">
             <div className="h-4 w-px bg-slate-200 mb-1" /> {/* Small spacer top */}
             <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white border-2 border-indigo-100 text-indigo-600 shadow-sm">
                <ArrowDown className="h-5 w-5" />
             </div>
          </div>

          <div className="flex-1">
             <CodicilCard 
               data={codicil} 
               onView={onView} 
             />
          </div>
        </div>
      ))}
      
      {onAdd && (
        <div className="pl-14 pt-2">
            <Button variant="outline" size="sm" onClick={onAdd} className="w-full border-dashed text-muted-foreground">
                + Draft New Amendment
            </Button>
        </div>
      )}
    </div>
  );
};