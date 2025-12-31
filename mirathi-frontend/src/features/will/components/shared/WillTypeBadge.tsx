import React from 'react';
import { Badge } from '@/components/ui';
import { WillType } from '@/types/will.types';
import { cn } from '@/lib/utils';
import { BookOpen, Scroll, Mic, Scale } from 'lucide-react';

interface WillTypeBadgeProps {
  type: WillType;
  className?: string;
}

export const WillTypeBadge: React.FC<WillTypeBadgeProps> = ({ type, className }) => {
  const getConfig = () => {
    switch (type) {
      case WillType.ISLAMIC:
        return {
          label: 'Islamic Will',
          icon: BookOpen, // Represents Quran/Scripture
          className: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
        };
      case WillType.CUSTOMARY:
        return {
          label: 'Customary',
          icon: Scroll, // Represents tradition
          className: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100'
        };
      case WillType.ORAL:
        return {
          label: 'Oral Will',
          icon: Mic,
          className: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
        };
      case WillType.STANDARD:
      default:
        return {
          label: 'Statutory',
          icon: Scale, // Represents Law of Succession Act
          className: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
        };
    }
  };

  const config = getConfig();
  const Icon = config.icon;

  return (
    <Badge 
      variant="outline" 
      className={cn("flex items-center gap-1.5 font-medium", config.className, className)}
    >
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </Badge>
  );
};