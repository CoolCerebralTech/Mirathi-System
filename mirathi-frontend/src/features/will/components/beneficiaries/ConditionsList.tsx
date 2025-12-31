import React from 'react';
import type { BequestCondition } from '@/types/will.types';
import { GraduationCap, Heart, Clock, CalendarDays, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui';

interface ConditionsListProps {
  conditions?: BequestCondition[];
  className?: string;
}

export const ConditionsList: React.FC<ConditionsListProps> = ({ conditions, className }) => {
  if (!conditions || conditions.length === 0) return null;

  const renderCondition = (condition: BequestCondition, index: number) => {
    // We determine content based on the discriminated union of the parameter
    const getConditionContent = () => {
      const param = condition.parameter;
      
      switch (param.type) {
        case 'AGE_REQUIREMENT':
          return {
            icon: <CalendarDays className="h-3.5 w-3.5" />,
            text: `Age ${param.minimumAge}+`,
            detail: `Beneficiary must attain the age of ${param.minimumAge}`
          };
        case 'SURVIVAL':
          return {
            icon: <Clock className="h-3.5 w-3.5" />,
            text: `Survive ${param.mustSurviveDays} days`,
            detail: `Must survive the testator by at least ${param.mustSurviveDays} days`
          };
        case 'EDUCATION':
          return {
            icon: <GraduationCap className="h-3.5 w-3.5" />,
            text: `Education: ${param.requiredLevel.replace(/_/g, ' ')}`,
            detail: `Must complete ${param.requiredLevel.replace(/_/g, ' ').toLowerCase()}`
          };
        case 'MARRIAGE': {
          // FIX: Wrapped in curly braces to create a block scope for the const
          const marriageText = param.mustBeMarried ? 'Must be Married' : 'Must not be Married';
          return {
            icon: <Heart className="h-3.5 w-3.5" />,
            text: marriageText,
            detail: marriageText
          };
        }
        case 'NONE':
        default:
          return {
            icon: <HelpCircle className="h-3.5 w-3.5" />,
            text: "Condition",
            detail: "Unspecified condition"
          };
      }
    };

    const content = getConditionContent();

    return (
      <TooltipProvider key={index}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 border border-amber-100 cursor-help transition-colors hover:bg-amber-100">
              {content.icon}
              <span>{content.text}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p className="text-xs">{content.detail}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <div className={`flex flex-wrap gap-2 ${className || ''}`}>
      {conditions.map((c, i) => renderCondition(c, i))}
    </div>
  );
};