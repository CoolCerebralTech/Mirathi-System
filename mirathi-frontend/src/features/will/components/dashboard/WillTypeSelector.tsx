import React from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui';
import { Label } from '@/components/ui';
import { BookOpen, Scale, Scroll, Mic, CheckCircle2 } from 'lucide-react';
import { WillType } from '@/types/will.types';
import { cn } from '@/lib/utils';

interface WillTypeSelectorProps {
  value: WillType;
  onChange: (value: WillType) => void;
  className?: string;
}

export const WillTypeSelector: React.FC<WillTypeSelectorProps> = ({ 
  value, 
  onChange,
  className 
}) => {
  const options = [
    {
      id: WillType.STANDARD,
      title: 'Statutory Will',
      description: 'Standard written will under the Law of Succession Act (Cap 160). Suitable for most Kenyans.',
      icon: Scale,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      border: 'peer-data-[state=checked]:border-indigo-600 peer-data-[state=checked]:ring-indigo-600'
    },
    {
      id: WillType.ISLAMIC,
      title: 'Islamic Will',
      description: 'Compliant with Sharia Law principles regarding fixed shares (Faraid) and bequeathable 1/3.',
      icon: BookOpen,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'peer-data-[state=checked]:border-emerald-600 peer-data-[state=checked]:ring-emerald-600'
    },
    {
      id: WillType.CUSTOMARY,
      title: 'Customary Will',
      description: 'Based on the traditions of your specific community. Limited applicability under modern law.',
      icon: Scroll,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'peer-data-[state=checked]:border-amber-600 peer-data-[state=checked]:ring-amber-600'
    },
    {
      id: WillType.ORAL,
      title: 'Oral Will',
      description: 'Valid only for 3 months after making. Usually for emergencies (S.9 LSA).',
      icon: Mic,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      border: 'peer-data-[state=checked]:border-purple-600 peer-data-[state=checked]:ring-purple-600'
    }
  ];

  return (
    <div className={cn("space-y-4", className)}>
      <RadioGroup 
        value={value} 
        onValueChange={(val) => onChange(val as WillType)}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {options.map((option) => {
          const Icon = option.icon;
          const isSelected = value === option.id;

          return (
            <div key={option.id} className="relative">
              <RadioGroupItem 
                value={option.id} 
                id={option.id} 
                className="peer sr-only" 
              />
              <Label
                htmlFor={option.id}
                className={cn(
                  "flex flex-col h-full cursor-pointer rounded-xl border-2 border-slate-200 bg-white p-6 transition-all hover:bg-slate-50 hover:border-slate-300",
                  "peer-data-[state=checked]:border-2", // Ensure border width stays consistent
                  option.border
                )}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={cn("rounded-full p-3", option.bg)}>
                    <Icon className={cn("h-6 w-6", option.color)} />
                  </div>
                  {isSelected && (
                    <CheckCircle2 className={cn("h-6 w-6", option.color)} />
                  )}
                </div>
                
                <h3 className="font-bold text-slate-900 text-lg mb-2">
                  {option.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {option.description}
                </p>
              </Label>
            </div>
          );
        })}
      </RadioGroup>
    </div>
  );
};