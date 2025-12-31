import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '../../../../lib/utils';

interface LiquidationTrackerProps {
    currentStep: number; // 1 to 4
}

export const LiquidationTracker: React.FC<LiquidationTrackerProps> = ({ currentStep }) => {
    const steps = [
        { id: 1, label: 'Initiated' },
        { id: 2, label: 'Court Approved' },
        { id: 3, label: 'Asset Sold' },
        { id: 4, label: 'Proceeds Banked' }
    ];

    return (
        <div className="relative flex items-center justify-between w-full">
            {/* Connecting Line */}
            <div className="absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 bg-slate-100" />
            
            {steps.map((step) => {
                const isCompleted = step.id <= currentStep;
                return (
                    <div key={step.id} className="relative z-10 flex flex-col items-center bg-white px-2">
                        <div className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors",
                            isCompleted ? "border-green-500 bg-green-50 text-green-600" : "border-slate-200 bg-white text-slate-300"
                        )}>
                            {isCompleted ? <Check className="h-4 w-4" /> : <span className="text-xs">{step.id}</span>}
                        </div>
                        <span className={cn(
                            "absolute -bottom-6 text-[10px] font-medium whitespace-nowrap",
                            isCompleted ? "text-slate-900" : "text-slate-400"
                        )}>
                            {step.label}
                        </span>
                    </div>
                );
            })}
        </div>
    );
};