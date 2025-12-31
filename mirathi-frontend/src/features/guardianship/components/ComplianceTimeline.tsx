import React from 'react';
import { format } from 'date-fns';
import { FileCheck, AlertCircle, Clock } from 'lucide-react';
import { useGuardianshipTimeline } from '../guardianship.api';
import { LoadingSpinner, EmptyState } from '../../../components/common';
import { cn } from '../../../lib/utils';

export const ComplianceTimeline: React.FC<{ id: string }> = ({ id }) => {
  const { data, isLoading } = useGuardianshipTimeline(id);

  if (isLoading) return <LoadingSpinner />;
  if (!data?.events.length) return <EmptyState title="No History" description="No events recorded yet." />;

  return (
    <div className="space-y-8 pl-2">
       {data.events.map((event, index) => (
         <div key={event.id} className="relative flex gap-6 pb-8 last:pb-0">
            {/* Connector Line */}
            {index !== data.events.length - 1 && (
                <div className="absolute left-[11px] top-8 h-full w-px bg-slate-200" />
            )}
            
            {/* Icon */}
            <div className={cn(
                "relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border bg-white",
                event.statusColor === 'green' ? "border-green-500 text-green-600" :
                event.statusColor === 'red' ? "border-red-500 text-red-600" :
                "border-slate-300 text-slate-500"
            )}>
                {event.statusColor === 'green' ? <FileCheck className="h-3 w-3" /> :
                 event.statusColor === 'red' ? <AlertCircle className="h-3 w-3" /> :
                 <Clock className="h-3 w-3" />}
            </div>

            {/* Content */}
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-500">
                        {format(new Date(event.date), 'MMM d, yyyy')}
                    </span>
                    <span className={cn(
                        "rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase",
                        event.statusColor === 'green' ? "bg-green-100 text-green-700" :
                        event.statusColor === 'red' ? "bg-red-100 text-red-700" :
                        "bg-slate-100 text-slate-700"
                    )}>
                        {event.type}
                    </span>
                </div>
                <h4 className="text-sm font-semibold">{event.title}</h4>
                <p className="text-sm text-muted-foreground">{event.description}</p>
                {event.documentUrl && (
                    <a href="#" className="text-xs text-primary underline mt-1">View Document</a>
                )}
            </div>
         </div>
       ))}
    </div>
  );
};