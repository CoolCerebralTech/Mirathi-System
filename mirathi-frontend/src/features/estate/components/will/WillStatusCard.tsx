import React from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Eye, 
  Printer 
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

export const WillStatusCard: React.FC<WillStatusCardProps> = ({ data, onPreview }) => {
  const { metadata } = data;
  const score = metadata.completenessScore;
  
  // Color code the progress bar
  const getProgressColor = (val: number) => {
    if (val === 100) return 'bg-green-600';
    if (val >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card className="border-t-4 border-t-blue-600">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">Last Will & Testament</CardTitle>
            <CardDescription>Legal Readiness Tracker (S.11 Compliance)</CardDescription>
          </div>
          <Badge variant={metadata.status === WillStatus.ACTIVE ? 'default' : 'secondary'}>
            {metadata.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress Section */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm font-medium">
            <span>Completeness Score</span>
            <span>{score}%</span>
          </div>
          <Progress value={score} className="h-2" indicatorClassName={getProgressColor(score)} />
        </div>

        {/* Warnings Section */}
        {metadata.validationWarnings.length > 0 ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Action Required for Validity</AlertTitle>
            <AlertDescription>
              <ul className="list-disc pl-5 mt-1 space-y-1 text-xs">
                {metadata.validationWarnings.map((warning, idx) => (
                  <li key={idx}>{warning}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="bg-green-50 border-green-200 text-green-800">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle>Ready for Execution</AlertTitle>
            <AlertDescription>
              Your draft meets all digital requirements. You can now print and sign it.
            </AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button onClick={onPreview} className="flex-1" variant="outline">
            <Eye className="w-4 h-4 mr-2" />
            Preview Document
          </Button>
          <Button onClick={onPreview} className="flex-1" disabled={score < 100}>
            <Printer className="w-4 h-4 mr-2" />
            Print for Signing
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};