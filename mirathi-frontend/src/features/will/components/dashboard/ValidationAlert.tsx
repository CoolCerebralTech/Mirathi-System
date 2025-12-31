import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ValidationAlertProps {
  errors: string[];
  title?: string;
  className?: string;
}

export const ValidationAlert: React.FC<ValidationAlertProps> = ({ 
  errors, 
  title = "Will has critical validation issues",
  className 
}) => {
  if (!errors || errors.length === 0) return null;

  return (
    <Alert 
      variant="destructive" 
      className={cn("border-amber-200 bg-amber-50 text-amber-900", className)}
    >
      <AlertTriangle className="h-5 w-5 text-amber-600" />
      <AlertTitle className="text-base font-semibold text-amber-800 mb-1">
        {title}
      </AlertTitle>
      <AlertDescription>
        <ul className="list-disc list-inside space-y-1 text-sm">
          {errors.slice(0, 3).map((error, index) => ( // Show first 3 for brevity
            <li key={index} className="text-amber-900">
              {error}
            </li>
          ))}
          {errors.length > 3 && (
            <li className="text-amber-700 font-medium">
              ...and {errors.length - 3} more issues.
            </li>
          )}
        </ul>
      </AlertDescription>
    </Alert>
  );
};