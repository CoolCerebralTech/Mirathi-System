import React from 'react';
import { AlertCircle, XCircle } from 'lucide-react';
import { 
  Alert, 
  AlertTitle, 
  AlertDescription 
} from '@/components/ui';
import type { ComplianceIssue } from '@/types/will.types';

interface ViolationsListProps {
  violations: ComplianceIssue[];
  className?: string;
}

export const ViolationsList: React.FC<ViolationsListProps> = ({ violations, className }) => {
  if (!violations || violations.length === 0) return null;

  return (
    <div className={`space-y-3 ${className || ''}`}>
      <h3 className="text-sm font-semibold text-red-700 flex items-center gap-2">
        <XCircle className="h-4 w-4" />
        Critical Violations (Must Fix)
      </h3>
      
      {violations.map((issue, index) => (
        <Alert key={index} variant="destructive" className="bg-red-50 border-red-200 text-red-900">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-sm font-bold ml-2">
            {issue.code}
          </AlertTitle>
          <AlertDescription className="text-sm ml-2 text-red-800">
            {issue.message}
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
};