import React from 'react';
import { Scale, Gavel, FileText, Banknote, Sparkles } from 'lucide-react';
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
  const getFormBadgeColor = (form: string): string => {
    if (form.includes('PA1') || form.includes('PROBATE')) return 'bg-purple-100 text-purple-800';
    if (form.includes('PA80') || form.includes('INTESTATE')) return 'bg-orange-100 text-orange-800';
    if (form.includes('PA5') || form.includes('SUMMARY')) return 'bg-blue-100 text-blue-800';
    if (form.includes('ISLAMIC')) return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getJurisdictionIcon = (jurisdiction: string) => {
    switch (jurisdiction) {
      case 'HIGH_COURT':
        return '⚖️';
      case 'MAGISTRATE_COURT':
        return '🏛️';
      case 'KADHIS_COURT':
        return '☪️';
      case 'CUSTOMARY_COURT':
        return '🌍';
      default:
        return '⚖️';
    }
  };

  return (
    <Card className="border-t-4 border-t-purple-600 shadow-md hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Scale className="h-5 w-5 text-purple-600" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              Digital Lawyer Assessment
              <Sparkles className="h-4 w-4 text-purple-600" />
            </CardTitle>
            <CardDescription>AI-powered legal guidance based on your estate</CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-5">
        {/* Recommendation Section */}
        <div className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border-2 border-purple-200 space-y-3">
          <div className="flex items-center gap-2 text-purple-900 font-semibold">
            <FileText className="h-4 w-4" />
            <span>Recommended Court Filing:</span>
          </div>
          
          <Badge 
            className={`${getFormBadgeColor(insights.recommendedForm)} hover:${getFormBadgeColor(insights.recommendedForm)} text-base px-4 py-1.5 font-semibold`}
          >
            {insights.recommendedForm.replace(/_/g, ' ')}
          </Badge>
          
          <p className="text-sm text-purple-900 leading-relaxed">
            {insights.explanation}
          </p>
        </div>

        <Separator />

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Jurisdiction */}
          <div className="space-y-2 p-3 bg-muted/50 rounded-lg border">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Gavel className="h-4 w-4" />
              <span>Court Jurisdiction</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{getJurisdictionIcon(insights.jurisdiction)}</span>
              <p className="font-semibold text-foreground">
                {insights.jurisdiction.replace(/_/g, ' ')}
              </p>
            </div>
          </div>

          {/* Estimated Court Fees */}
          <div className="space-y-2 p-3 bg-muted/50 rounded-lg border">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Banknote className="h-4 w-4" />
              <span>Estimated Court Fees</span>
            </div>
            <p className="font-semibold text-foreground text-lg">
              {insights.estimatedCourtFees}
            </p>
          </div>
        </div>

        {/* Legal Notice */}
        <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-md border">
          <p className="font-semibold text-foreground mb-1">ℹ️ Legal Disclaimer:</p>
          <p>
            This assessment is generated based on your estate's current value and structure. 
            For final legal advice, please consult with a qualified advocate or succession lawyer.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};