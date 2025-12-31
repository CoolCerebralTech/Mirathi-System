import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui';
import { AlertCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ValidationErrorsListProps {
  errors: string[];
  title?: string;
  className?: string;
}

export const ValidationErrorsList: React.FC<ValidationErrorsListProps> = ({ 
  errors, 
  title = "Validation Issues Found",
  className 
}) => {
  if (!errors || errors.length === 0) return null;

  return (
    <Alert variant="destructive" className={cn("bg-red-50 border-red-200 text-red-900", className)}>
      <AlertCircle className="h-4 w-4 text-red-600" />
      <AlertTitle className="text-red-800 font-semibold mb-2">
        {title}
      </AlertTitle>
      <AlertDescription>
        <ul className="space-y-1.5 list-none pl-1">
          {errors.map((error, index) => (
            <li key={index} className="flex items-start gap-2 text-sm">
              <XCircle className="h-4 w-4 mt-0.5 text-red-500 shrink-0" />
              <span>{error}</span>
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
};