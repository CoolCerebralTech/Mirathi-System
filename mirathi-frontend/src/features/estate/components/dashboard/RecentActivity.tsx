import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Activity, FilePlus, DollarSign, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, ScrollArea } from '../../../../components/ui';
import { cn } from '../../../../lib/utils';

// Temporary interface until backend implements the audit endpoint
export interface ActivityEvent {
  id: string;
  type: 'ASSET_ADDED' | 'DEBT_PAID' | 'ESTATE_FROZEN' | 'DOC_UPLOADED' | 'RISK_ALERT';
  description: string;
  timestamp: string;
  actorName: string;
}

interface RecentActivityProps {
  activities?: ActivityEvent[]; // Optional for now
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ activities = [] }) => {
  
  const getIcon = (type: string) => {
    switch(type) {
        case 'ASSET_ADDED': return <FilePlus className="h-4 w-4 text-blue-500" />;
        case 'DEBT_PAID': return <DollarSign className="h-4 w-4 text-green-500" />;
        case 'RISK_ALERT': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
        case 'ESTATE_FROZEN': return <Activity className="h-4 w-4 text-red-500" />;
        default: return <CheckCircle2 className="h-4 w-4 text-slate-500" />;
    }
  };

  return (
    <Card className="h-full max-h-[400px] flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
            <span>Recent Activity</span>
            <span className="text-xs font-normal text-muted-foreground cursor-pointer hover:underline">View All</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-[300px]">
            {activities.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm">
                    <Activity className="h-8 w-8 mb-2 opacity-20" />
                    No recent activity recorded.
                </div>
            ) : (
                <div className="flex flex-col">
                    {activities.map((item, i) => (
                        <div key={item.id} className={cn(
                            "flex gap-3 px-6 py-3 hover:bg-slate-50 transition-colors",
                            i !== activities.length - 1 && "border-b border-slate-100"
                        )}>
                            <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100">
                                {getIcon(item.type)}
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <span className="text-sm font-medium text-slate-900">
                                    {item.description}
                                </span>
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <span>{item.actorName}</span>
                                    <span>•</span>
                                    <span>{formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};