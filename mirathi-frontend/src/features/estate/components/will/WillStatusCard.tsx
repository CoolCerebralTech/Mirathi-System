import React from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Eye, 
  Printer,
  FileText
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  Progress,
  Button,
  Alert,
  AlertTitle,
  AlertDescription,
  Badge
} from '@/components/ui';
import { type WillPreviewResponse, WillStatus } from '@/types/estate.types';

interface WillStatusCardProps {
  data: WillPreviewResponse;
  onPreview: () => void;
}

export const WillStatusCard: React.FC<WillStatusCardProps> = ({ 
  data, 
  onPreview 
}) => {
  const { metadata } = data;
  const score = metadata.completenessScore;
  
  // Progress bar color based on score
  const getProgressColor = (value: number): string => {
    if (value === 100) return 'bg-green-600';
    if (value >= 70) return 'bg-yellow-500';
    if (value >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  // Status badge variant
  const getStatusBadge = (status: WillStatus) => {
    const variants: Record<WillStatus, { className: string }> = {
      DRAFT: { className: 'border-blue-400 text-blue-700 bg-blue-50' },
      ACTIVE: { className: 'bg-green-600 text-white' },
      SUPERSEDED: { className: 'border-gray-400 text-gray-600 bg-gray-50' },
      REVOKED: { className: 'bg-red-600 text-white' },
      EXECUTED: { className: 'bg-purple-600 text-white' },
    };
    
    const config = variants[status];
    return (
      <Badge className={config.className}>
        {status}
      </Badge>
    );
  };

  const getScoreMessage = (value: number): string => {
    if (value === 100) return 'Your will is ready for execution';
    if (value >= 70) return 'Almost complete - a few items remaining';
    if (value >= 40) return 'Good progress - continue adding details';
    return 'Just getting started - more information needed';
  };

  return (
    <Card className="border-t-4 border-t-primary shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <CardTitle className="text-xl">Last Will & Testament</CardTitle>
            </div>
            <CardDescription>
              Legal Readiness Tracker • Section 11 Law of Succession Act Compliance
            </CardDescription>
          </div>
          {getStatusBadge(metadata.status)}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Completeness Progress */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-semibold text-foreground">
                Completeness Score
              </p>
              <p className="text-xs text-muted-foreground">
                {getScoreMessage(score)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">{score}%</p>
            </div>
          </div>
          <Progress 
            value={score} 
            className="h-3" 
          />
          <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${getProgressColor(score)}`}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>

        {/* Validation Warnings or Success */}
        {metadata.validationWarnings.length > 0 ? (
          <Alert variant="destructive" className="border-l-4 border-l-red-600">
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle className="font-semibold">Action Required for Legal Validity</AlertTitle>
            <AlertDescription>
              <ul className="list-disc pl-5 mt-2 space-y-1.5 text-sm">
                {metadata.validationWarnings.map((warning, idx) => (
                  <li key={idx}>{warning}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="bg-green-50 border-green-300 border-l-4 border-l-green-600">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <AlertTitle className="font-semibold text-green-900">
              Ready for Execution ✓
            </AlertTitle>
            <AlertDescription className="text-green-800 text-sm">
              Your draft will meets all digital requirements. You may now print the document, 
              sign it in the presence of your 2 witnesses, and store it securely.
            </AlertDescription>
          </Alert>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-muted/50 p-3 rounded-lg text-center border">
            <p className="text-xs text-muted-foreground">Will ID</p>
            <p className="text-sm font-mono font-semibold mt-1 truncate">
              {metadata.willId.slice(0, 8)}...
            </p>
          </div>
          <div className="bg-muted/50 p-3 rounded-lg text-center border">
            <p className="text-xs text-muted-foreground">Status</p>
            <p className="text-sm font-semibold mt-1">
              {metadata.status}
            </p>
          </div>
          <div className="bg-muted/50 p-3 rounded-lg text-center border">
            <p className="text-xs text-muted-foreground">Warnings</p>
            <p className="text-sm font-semibold mt-1">
              {metadata.validationWarnings.length}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <Button 
            onClick={onPreview} 
            className="flex-1" 
            variant="outline"
            size="lg"
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview Document
          </Button>
          <Button 
            onClick={onPreview} 
            className="flex-1" 
            disabled={score < 100}
            size="lg"
          >
            <Printer className="w-4 h-4 mr-2" />
            {score === 100 ? 'Print for Signing' : `Complete (${score}%)`}
          </Button>
        </div>

        {/* Legal Notice */}
        <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded border">
          <p className="font-semibold text-foreground mb-1">Legal Requirements:</p>
          <ul className="space-y-0.5 pl-4 list-disc">
            <li>Must be signed by testator in sound mind</li>
            <li>Requires 2 competent witnesses present at signing</li>
            <li>Witnesses cannot be beneficiaries (S.13 LSA)</li>
            <li>Original must be stored securely</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};