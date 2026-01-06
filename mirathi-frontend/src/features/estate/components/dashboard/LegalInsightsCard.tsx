import React from 'react';
import { Scale, Gavel, FileText, Banknote } from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  Separator,
  Badge
} from '@/components/ui';
import { type LegalInsights } from '@/types/estate.types';

interface LegalInsightsCardProps {
  insights: LegalInsights;
}

export const LegalInsightsCard: React.FC<LegalInsightsCardProps> = ({ insights }) => {
  return (
    <Card className="border-t-4 border-t-purple-600 shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Scale className="h-5 w-5 text-purple-600" />
          <CardTitle className="text-lg">Legal Assessment</CardTitle>
        </div>
        <CardDescription>Based on your current Net Worth & Will Status</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Recommendation */}
        <div className="p-4 bg-purple-50 rounded-md border border-purple-100 space-y-2">
          <div className="flex items-center gap-2 text-purple-900 font-semibold">
            <FileText className="h-4 w-4" />
            <span>Recommended Filing:</span>
          </div>
          <Badge variant="secondary" className="bg-white text-purple-700 border-purple-200 text-base px-3 py-1">
            {insights.recommendedForm.replace(/_/g, ' ')}
          </Badge>
          <p className="text-sm text-purple-800 leading-relaxed">
            {insights.explanation}
          </p>
        </div>

        <Separator />

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Gavel className="h-4 w-4" />
              Jurisdiction
            </div>
            <p className="font-medium text-foreground">{insights.jurisdiction.replace('_', ' ')}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Banknote className="h-4 w-4" />
              Est. Court Fees
            </div>
            <p className="font-medium text-foreground">{insights.estimatedCourtFees}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};