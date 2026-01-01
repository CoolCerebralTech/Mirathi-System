// components/distribution/ReadinessChecklist.tsx

import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { ReadinessCheck } from '@/types/estate.types';

interface ReadinessChecklistProps {
  check: ReadinessCheck;
}

export const ReadinessChecklist: React.FC<ReadinessChecklistProps> = ({ check }) => {
  const isReady = check.isReady;

  return (
    <Card className={cn("border-l-4 shadow-sm", 
      isReady ? "border-l-emerald-500 bg-emerald-50/10" : "border-l-red-500 bg-red-50/10"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            {isReady ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-red-600" />
            )}
            Distribution Readiness
          </CardTitle>
          <span className={cn("text-xs font-bold px-2 py-1 rounded-full", 
            isReady ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
          )}>
            {isReady ? "READY TO DISTRIBUTE" : "ACTION REQUIRED"}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {isReady ? (
          <p className="text-sm text-slate-600">
            All pre-conditions for distribution have been met. The estate is solvent, debts are settled, and the 6-month statutory notice period has lapsed.
          </p>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-900">
              The following items must be resolved before distribution can commence:
            </p>
            <ul className="space-y-2">
              {check.blockers.map((blocker, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-slate-700 bg-white p-2 rounded border border-red-100">
                  <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  <span>{blocker}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};