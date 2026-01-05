// FILE: src/features/family/components/SmartSuggestions.tsx

import React from 'react';
import { Lightbulb, ArrowRight, X } from 'lucide-react';
import { 
  Alert, 
  AlertTitle, 
  AlertDescription,
  Button 
} from '@/components/ui';
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

  return (
    <div className="space-y-3">
      {suggestions.map((suggestion, index) => (
        <Alert 
          key={`${suggestion.code}-${index}`} 
          className="relative border-blue-200 bg-blue-50/50 shadow-sm transition-all hover:bg-blue-50"
        >
          <Lightbulb className="h-4 w-4 text-amber-500" />
          
          <div className="pr-8">
            <AlertTitle className="text-blue-900">Recommendation</AlertTitle>
            <AlertDescription className="mt-1 text-blue-800">
              {suggestion.message}
            </AlertDescription>
            
            <div className="mt-3">
              <Button 
                size="sm" 
                variant="outline" 
                className="bg-white text-blue-700 hover:text-blue-800 border-blue-200 h-8 gap-1"
                onClick={() => onAction(suggestion)}
              >
                Apply Recommendation
                <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <button 
            onClick={() => onDismiss(index)}
            className="absolute right-3 top-3 rounded-full p-1 text-blue-400 hover:bg-blue-100 hover:text-blue-600 transition-colors"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Dismiss</span>
          </button>
        </Alert>
      ))}
    </div>
  );
};