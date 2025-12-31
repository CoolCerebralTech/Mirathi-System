import React from 'react';
import { Badge } from '@/components/ui';
import { BequestType } from '@/types/will.types';
import { cn } from '@/lib/utils';
import { 
  Banknote, 
  Home, 
  PieChart, 
  Percent, 
  Briefcase, 
  HelpCircle,
  type LucideIcon 
} from 'lucide-react';

interface BequestTypeBadgeProps {
  type: string;
  className?: string;
}

// Define the shape of our config to ensure variant matches Badge props
interface BadgeConfig {
  label: string;
  icon: LucideIcon;
  variant: "default" | "secondary" | "destructive" | "outline";
  className: string;
}

export const BequestTypeBadge: React.FC<BequestTypeBadgeProps> = ({ type, className }) => {
  const getConfig = (): BadgeConfig => {
    switch (type) {
      case BequestType.SPECIFIC_ASSET:
        return { 
          label: 'Specific Asset', 
          icon: Home, 
          variant: 'outline', 
          className: 'text-blue-600 bg-blue-50 border-blue-200' 
        };
      case BequestType.RESIDUARY:
        return { 
          label: 'Residuary', 
          icon: PieChart, 
          variant: 'default', 
          className: 'bg-indigo-600 text-white border-transparent' 
        };
      case BequestType.PERCENTAGE:
        return { 
          label: 'Percentage', 
          icon: Percent, 
          variant: 'outline', 
          className: 'text-emerald-600 bg-emerald-50 border-emerald-200' 
        };
      case BequestType.FIXED_AMOUNT:
        return { 
          label: 'Cash Sum', 
          icon: Banknote, 
          variant: 'outline', 
          className: 'text-green-700 bg-green-50 border-green-200' 
        };
      case BequestType.TRUST:
        return { 
          label: 'Trust', 
          icon: Briefcase, 
          variant: 'secondary', 
          className: 'text-purple-600 bg-purple-50 border-purple-200' 
        };
      default:
        return { 
          label: type.replace(/_/g, ' '), 
          icon: HelpCircle, 
          variant: 'outline', 
          className: 'text-slate-600' 
        };
    }
  };

  const config = getConfig();
  const Icon = config.icon;

  return (
    <Badge 
      variant={config.variant} 
      className={cn("flex w-fit items-center gap-1.5 capitalize whitespace-nowrap", config.className, className)}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
};