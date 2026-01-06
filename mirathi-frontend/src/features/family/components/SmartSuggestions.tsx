// ============================================================================
// FILE 4: SmartSuggestions.tsx - UPDATED
// ============================================================================

import React from 'react';
import { Lightbulb, ArrowRight, X, AlertCircle } from 'lucide-react';
import { 
  Alert, 
  AlertTitle, 
  AlertDescription,
  Button 
} from '@/components/ui';
import { cn } from '@/lib/utils';
import type { SmartSuggestion } from '@/types/family.types';

interface SmartSuggestionsProps {
  suggestions: SmartSuggestion[];
  onAction: (suggestion: SmartSuggestion) => void;
  onDismiss: (index: number) => void;
}

export const SmartSuggestions: React.FC<SmartSuggestionsProps> = ({ 
  suggestions, 
  onAction, 
  onDismiss 
}) => {
  if (!suggestions || suggestions.length === 0) return null;

  const getSeverityStyles = (severity?: SmartSuggestion['severity']) => {
    switch (severity) {
      case 'error':
        return {
          container: 'border-red-200 bg-red-50/50',
          icon: 'text-red-500',
          title: 'text-red-900',
          description: 'text-red-800',
          button: 'bg-white text-red-700 hover:text-red-800 border-red-200',
        };
      case 'warning':
        return {
          container: 'border-amber-200 bg-amber-50/50',
          icon: 'text-amber-500',
          title: 'text-amber-900',
          description: 'text-amber-800',
          button: 'bg-white text-amber-700 hover:text-amber-800 border-amber-200',
        };
      default: // 'info'
        return {
          container: 'border-blue-200 bg-blue-50/50',
          icon: 'text-amber-500',
          title: 'text-blue-900',
          description: 'text-blue-800',
          button: 'bg-white text-blue-700 hover:text-blue-800 border-blue-200',
        };
    }
  };

  const getIcon = (severity?: SmartSuggestion['severity']) => {
    switch (severity) {
      case 'error':
        return AlertCircle;
      case 'warning':
        return AlertCircle;
      default:
        return Lightbulb;
    }
  };

  return (
    <div className="space-y-3">
      {suggestions.map((suggestion, index) => {
        const styles = getSeverityStyles(suggestion.severity);
        const Icon = getIcon(suggestion.severity);
        
        return (
          <Alert 
            key={`${suggestion.code}-${index}`} 
            className={cn(
              "relative shadow-sm transition-all hover:shadow-md",
              styles.container
            )}
          >
            <Icon className={cn("h-4 w-4", styles.icon)} />
            
            <div className="pr-8">
              <AlertTitle className={styles.title}>
                {suggestion.severity === 'error' ? 'Critical Issue' : 
                 suggestion.severity === 'warning' ? 'Warning' : 
                 'Smart Recommendation'}
              </AlertTitle>
              <AlertDescription className={cn("mt-1", styles.description)}>
                {suggestion.message}
              </AlertDescription>
              
              {suggestion.action && (
                <div className="mt-3">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className={cn("h-8 gap-1", styles.button)}
                    onClick={() => onAction(suggestion)}
                  >
                    {suggestion.action}
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>

            <button 
              onClick={() => onDismiss(index)}
              className={cn(
                "absolute right-3 top-3 rounded-full p-1 transition-colors",
                suggestion.severity === 'error' 
                  ? "text-red-400 hover:bg-red-100 hover:text-red-600"
                  : suggestion.severity === 'warning'
                  ? "text-amber-400 hover:bg-amber-100 hover:text-amber-600"
                  : "text-blue-400 hover:bg-blue-100 hover:text-blue-600"
              )}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Dismiss</span>
            </button>
          </Alert>
        );
      })}
    </div>
  );
};