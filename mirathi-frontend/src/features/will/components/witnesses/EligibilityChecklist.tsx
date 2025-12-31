import React from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EligibilityChecklistProps {
  className?: string;
}

export const EligibilityChecklist: React.FC<EligibilityChecklistProps> = ({ className }) => {
  const criteria = [
    { label: "Must be over 18 years old", type: "req" },
    { label: "Must be of sound mind", type: "req" },
    { label: "Must see you sign the Will", type: "req" },
    { label: "CANNOT be a beneficiary (S.13)", type: "crit" },
    { label: "CANNOT be a spouse of a beneficiary", type: "crit" },
  ];

  return (
    <div className={cn("rounded-lg border border-slate-200 bg-slate-50 p-4", className)}>
      <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Legal Requirements (S.11 LSA)
      </h4>
      <ul className="space-y-2">
        {criteria.map((item, idx) => (
          <li key={idx} className="flex items-start gap-2.5 text-sm">
            {item.type === 'crit' ? (
               <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                 <X className="h-3 w-3" />
               </div>
            ) : (
               <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                 <Check className="h-3 w-3" />
               </div>
            )}
            <span className={cn(
              "leading-tight",
              item.type === 'crit' ? "font-medium text-red-700" : "text-slate-600"
            )}>
              {item.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};