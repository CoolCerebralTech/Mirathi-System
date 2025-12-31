import React from 'react';
import { CheckSquare, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';

interface RecommendationsListProps {
  recommendations: string[];
  onAction?: (actionIndex: number) => void; // Optional handler for "Fix It" buttons
  className?: string;
}

export const RecommendationsList: React.FC<RecommendationsListProps> = ({ 
  recommendations, 
  onAction,
  className 
}) => {
  if (!recommendations || recommendations.length === 0) return null;

  return (
    <Card className={`border-blue-100 bg-blue-50/30 ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-blue-900 flex items-center gap-2">
          <CheckSquare className="h-5 w-5 text-blue-600" />
          Recommended Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {recommendations.map((rec, index) => (
            <li key={index} className="flex items-start gap-3 bg-white p-3 rounded-md border border-blue-100 shadow-sm">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-xs font-bold">
                {index + 1}
              </div>
              <div className="flex-1 pt-0.5">
                <p className="text-sm text-slate-700 leading-snug">{rec}</p>
              </div>
              {onAction && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0 text-blue-500 hover:text-blue-700"
                  onClick={() => onAction(index)}
                >
                  <ArrowRight className="h-4 w-4" />
                  <span className="sr-only">Fix</span>
                </Button>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};