// features/documents/components/shared/ReferenceDisplay.tsx

import React from 'react';
import { Badge } from '@/components/ui';
import { FileText, Sparkles, Copy, Check } from 'lucide-react';
import { 
  type ReferenceType, 
  getReferenceTypeLabel,
  getOcrConfidenceLabel 
} from '@/types/document.types';

interface ReferenceDisplayProps {
  referenceNumber?: string | null;
  referenceType?: ReferenceType | null;
  ocrConfidence?: number | null;
  className?: string;
}

export const ReferenceDisplay: React.FC<ReferenceDisplayProps> = ({
  referenceNumber,
  referenceType,
  ocrConfidence,
  className,
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    if (referenceNumber) {
      navigator.clipboard.writeText(referenceNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!referenceNumber) {
    return (
      <div className={`rounded-lg border border-dashed p-3 ${className}`}>
        <div className="flex items-center gap-2 text-muted-foreground">
          <FileText className="h-4 w-4" />
          <span className="text-sm">No reference extracted</span>
        </div>
      </div>
    );
  }

  const confidenceLabel = getOcrConfidenceLabel(ocrConfidence);
  const confidenceColor = 
    confidenceLabel === 'High' ? 'text-green-600' :
    confidenceLabel === 'Medium' ? 'text-yellow-600' :
    'text-red-600';

  return (
    <div className={`rounded-lg border bg-muted/50 p-3 ${className}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">
              Auto-extracted
            </span>
            {ocrConfidence && (
              <Badge variant="outline" className="text-xs">
                <span className={confidenceColor}>
                  {confidenceLabel} confidence
                </span>
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-semibold">
              {referenceNumber}
            </span>
            <button
              onClick={handleCopy}
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="Copy reference number"
            >
              {copied ? (
                <Check className="h-3 w-3 text-green-600" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </button>
          </div>
          
          {referenceType && (
            <p className="text-xs text-muted-foreground mt-1">
              {getReferenceTypeLabel(referenceType)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};