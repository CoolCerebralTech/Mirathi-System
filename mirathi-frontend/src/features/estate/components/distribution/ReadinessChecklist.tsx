import React from 'react';
import { Check, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui';

interface ReadinessChecklistProps {
    checks: { label: string; passed: boolean }[];
}

export const ReadinessChecklist: React.FC<ReadinessChecklistProps> = ({ checks }) => {
    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-base">Distribution Readiness</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                {checks.map((check, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                        <div className={`flex h-5 w-5 items-center justify-center rounded-full ${check.passed ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                            {check.passed ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                        </div>
                        <span className={check.passed ? 'text-slate-600' : 'text-red-700 font-medium'}>
                            {check.label}
                        </span>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
};