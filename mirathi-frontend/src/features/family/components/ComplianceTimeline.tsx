import { FileCheck, AlertTriangle, CheckCircle, Clock, CalendarDays } from 'lucide-react';
import { useGuardianshipTimeline } from '../../guardianship/guardianship.api';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';

interface ComplianceTimelineProps {
  guardianshipId: string;
}

export function ComplianceTimeline({ guardianshipId }: ComplianceTimelineProps) {
  const { data, isLoading } = useGuardianshipTimeline(guardianshipId);

  if (isLoading) return <LoadingSpinner />;
  if (!data) return null;

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'file-check': return <FileCheck className="h-4 w-4" />;
      case 'alert': return <AlertTriangle className="h-4 w-4" />;
      case 'check': return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getColorClass = (color: string) => {
    switch (color) {
      case 'green': return 'bg-green-100 text-green-700 border-green-200';
      case 'red': return 'bg-red-100 text-red-700 border-red-200';
      case 'amber': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Compliance Audit Trail</CardTitle>
          <Badge variant={data.summary.status === 'COMPLIANT' ? 'default' : 'destructive'}>
            {data.summary.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-50 p-3 rounded-lg text-center">
            <p className="text-2xl font-bold">{data.summary.onTimeRate}%</p>
            <p className="text-xs text-muted-foreground">On-Time Rate</p>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg text-center">
             <p className="text-2xl font-bold text-primary">{data.summary.totalReports}</p>
             <p className="text-xs text-muted-foreground">Reports Filed</p>
          </div>
        </div>

        {/* Vertical Timeline */}
        <div className="relative space-y-0 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
          {data.events.map((event) => (
            <div key={event.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              
              {/* Icon Marker */}
              <div className={`
                 flex items-center justify-center w-10 h-10 rounded-full border-2 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 
                 ${getColorClass(event.statusColor)}
              `}>
                {getIcon(event.icon)}
              </div>

              {/* Content Card */}
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded border shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <time className="font-caveat font-medium text-xs text-muted-foreground">
                    {new Date(event.date).toLocaleDateString()}
                  </time>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${getColorClass(event.statusColor)}`}>
                    {event.type.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-sm font-semibold text-slate-900">{event.title}</div>
                <div className="text-xs text-slate-500 mt-1">{event.description}</div>
                {event.actor && (
                  <div className="mt-2 text-[10px] text-muted-foreground flex items-center gap-1">
                    <User className="h-3 w-3" /> {event.actor}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}