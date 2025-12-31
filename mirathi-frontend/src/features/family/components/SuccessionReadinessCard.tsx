import React from 'react';
import { CheckCircle, AlertOctagon, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Progress, Button } from '../../../components/ui';
import { useSuccessionReadiness } from '../family.api';
import { cn } from '../../../lib/utils';

interface SuccessionReadinessCardProps {
  familyId: string;
}

export const SuccessionReadinessCard: React.FC<SuccessionReadinessCardProps> = ({ familyId }) => {
  const { data, isLoading } = useSuccessionReadiness(familyId);

  if (isLoading || !data) return null; // Skeleton in parent

  const score = data.overallScore;
  const isReady = data.readinessLevel === 'READY_TO_FILE';

  return (
    <Card className={cn("overflow-hidden", isReady ? "border-green-200" : "border-amber-200")}>
      <CardHeader className={cn("pb-2", isReady ? "bg-green-50" : "bg-amber-50")}>
        <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Readiness Assessment</CardTitle>
            <span className="text-2xl font-bold">{score}%</span>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6 space-y-4">
        <Progress value={score} className={cn("h-2", isReady ? "bg-green-100" : "bg-amber-100")} />
        
        <div className="space-y-2">
            {data.recommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-3 rounded-md border p-3 text-sm">
                    {rec.priority === 'HIGH' ? (
                        <AlertOctagon className="mt-0.5 h-4 w-4 text-red-500 shrink-0" />
                    ) : (
                        <CheckCircle className="mt-0.5 h-4 w-4 text-green-500 shrink-0" />
                    )}
                    <div className="flex-1">
                        <p className="font-medium">{rec.title}</p>
                        <p className="text-muted-foreground text-xs">{rec.description}</p>
                    </div>
                    {rec.actionLink && (
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                            <ArrowRight className="h-3 w-3" />
                        </Button>
                    )}
                </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
};