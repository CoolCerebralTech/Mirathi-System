import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { 
  Alert, 
  AlertDescription 
} from '@/components/ui';
import type { ComplianceIssue } from '@/types/will.types';

interface WarningsListProps {
  warnings: ComplianceIssue[];
  className?: string;
}

export const WarningsList: React.FC<WarningsListProps> = ({ warnings, className }) => {
  if (!warnings || warnings.length === 0) return null;

  return (
    <div className={`space-y-3 ${className || ''}`}>
      <h3 className="text-sm font-semibold text-amber-700 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4" />
        Risk Warnings (Advisory)
      </h3>
      
      <div className="space-y-2">
        {warnings.map((issue, index) => (
          <Alert key={index} className="bg-amber-50 border-amber-200 text-amber-900 py-3">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-sm ml-2 font-medium">
              {issue.message}
            </AlertDescription>
          </Alert>
        ))}
      </div>
    </div>
  );
};