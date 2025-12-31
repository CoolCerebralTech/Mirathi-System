import React from 'react';
import { CapacityStatus } from '@/types/will.types';
import { format } from 'date-fns';
import { CheckCircle2, Circle, AlertCircle, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

// Defining a local interface for history items since the main API type 
// aggregates this into a summary. This mirrors what a /history endpoint would return.
export interface CapacityHistoryItem {
  id: string;
  status: CapacityStatus;
  date: string;
  assessedBy?: string;
  notes?: string;
  documentId?: string;
}

interface CapacityTimelineProps {
  events: CapacityHistoryItem[];
  className?: string;
}

export const CapacityTimeline: React.FC<CapacityTimelineProps> = ({ events, className }) => {
  if (!events || events.length === 0) return null;

  // Sort by date descending (newest first)
  const sortedEvents = [...events].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const getStatusIcon = (status: CapacityStatus) => {
    switch (status) {
      case CapacityStatus.ASSESSED_COMPETENT:
      case CapacityStatus.MEDICAL_CERTIFICATION:
        return CheckCircle2;
      case CapacityStatus.ASSESSED_INCOMPETENT:
        return AlertCircle;
      default:
        return Circle;
    }
  };

  const formatStatusLabel = (status: string) => {
    return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className={cn("space-y-4", className)}>
      <h4 className="text-sm font-semibold text-slate-900 mb-4">Assessment History</h4>
      <div className="relative pl-2">
        {/* Vertical Line */}
        <div className="absolute left-[11px] top-2 bottom-4 w-px bg-slate-200" />

        <div className="space-y-6">
          {sortedEvents.map((event, index) => {
            const Icon = getStatusIcon(event.status);
            const isLatest = index === 0;

            return (
              <div key={event.id} className="relative flex gap-4 group">
                {/* Icon Wrapper */}
                <div className={cn(
                  "relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border bg-white",
                  isLatest ? "border-indigo-600 text-indigo-600 ring-2 ring-indigo-100" : "border-slate-300 text-slate-400"
                )}>
                  <Icon className="h-3.5 w-3.5" />
                </div>

                {/* Content */}
                <div className="flex-1 pt-0.5">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-1">
                    <p className={cn(
                      "text-sm font-medium", 
                      isLatest ? "text-slate-900" : "text-slate-600"
                    )}>
                      {formatStatusLabel(event.status)}
                    </p>
                    <time className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(event.date), 'MMM d, yyyy h:mm a')}
                    </time>
                  </div>

                  {event.assessedBy && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      Assessed by: <span className="font-medium text-slate-700">{event.assessedBy}</span>
                    </p>
                  )}

                  {event.notes && (
                    <div className="mt-2 rounded-md bg-slate-50 p-2 text-xs text-slate-600 border border-slate-100">
                      {event.notes}
                    </div>
                  )}
                  
                  {event.documentId && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-xs text-indigo-600 cursor-pointer hover:underline">
                      <FileText className="h-3 w-3" />
                      <span>View supporting document</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};