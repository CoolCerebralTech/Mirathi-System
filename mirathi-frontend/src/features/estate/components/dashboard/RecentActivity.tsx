// components/dashboard/RecentActivity.tsx

import React from 'react';
import { format } from 'date-fns';
import { Activity, FileText, DollarSign, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { ScrollArea } from '@/components/ui';

// Define structure for activity items
export interface ActivityItem {
  id: string;
  type: 'ASSET' | 'DEBT' | 'SYSTEM' | 'WARNING' | 'INFO';
  description: string;
  timestamp: string; // ISO Date string
  user?: string;
}

interface RecentActivityProps {
  activities?: ActivityItem[]; 
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ activities = [] }) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'ASSET': return <FileText className="h-4 w-4 text-blue-500" />;
      case 'DEBT': return <DollarSign className="h-4 w-4 text-red-500" />;
      case 'SYSTEM': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case 'WARNING': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      default: return <Activity className="h-4 w-4 text-slate-500" />;
    }
  };

  return (
    <Card className="shadow-sm h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Activity className="h-5 w-5 text-slate-500" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[300px] px-6">
          <div className="space-y-6 py-4">
            {activities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <p className="text-sm italic">No recent activity recorded.</p>
              </div>
            ) : (
              activities.map((item, index) => (
                <div key={item.id || index} className="flex gap-4 relative group">
                  {/* Timeline Line */}
                  {index !== activities.length - 1 && (
                    <div className="absolute left-[11px] top-6 bottom-[-24px] w-px bg-slate-200 group-last:hidden" />
                  )}
                  
                  {/* Icon Bubble */}
                  <div className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-50 border border-slate-200 shadow-sm mt-0.5">
                    {getIcon(item.type)}
                  </div>
                  
                  {/* Content */}
                  <div className="flex flex-col gap-1 pb-1">
                    <p className="text-sm font-medium text-slate-900 leading-none">
                      {item.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{format(new Date(item.timestamp), 'MMM d, h:mm a')}</span>
                      {item.user && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span>{item.user}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};