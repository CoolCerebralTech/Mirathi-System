import React from 'react';
import { format } from 'date-fns';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { ScrollArea } from '../../../../components/ui';
import { MoneyDisplay } from '../shared/MoneyDisplay';
import { cn } from '../../../../lib/utils';

// Logic: Mocking a history array since it's not in the base Asset Response
// In production, this would be fetched via `useAssetDetails`
interface ValuationRecord {
    id: string;
    date: string;
    amount: number;
    currency: string;
    source: string;
    reason?: string;
}

interface ValuationHistoryProps {
    history?: ValuationRecord[];
}

export const ValuationHistory: React.FC<ValuationHistoryProps> = ({ history = [] }) => {
    return (
        <div className="space-y-4">
            <h3 className="font-semibold text-sm text-slate-900">Valuation Timeline</h3>
            <ScrollArea className="h-[200px] pr-4">
                <div className="relative border-l border-slate-200 ml-2 space-y-6">
                    {history.length === 0 ? (
                        <div className="pl-6 text-sm text-muted-foreground italic">
                            No historical valuations recorded.
                        </div>
                    ) : (
                        history.map((record, i) => {
                            const prev = history[i + 1];
                            const isIncrease = prev ? record.amount > prev.amount : true;
                            const isDecrease = prev ? record.amount < prev.amount : false;

                            return (
                                <div key={record.id} className="relative pl-6">
                                    <div className={cn(
                                        "absolute -left-1.5 top-1 h-3 w-3 rounded-full border-2 border-white",
                                        isIncrease ? "bg-green-500" : isDecrease ? "bg-red-500" : "bg-slate-400"
                                    )} />
                                    
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-sm">
                                                <MoneyDisplay amount={{ amount: record.amount, currency: record.currency }} />
                                            </span>
                                            {prev && (
                                                <span className="text-xs">
                                                    {isIncrease && <TrendingUp className="h-3 w-3 text-green-500 inline" />}
                                                    {isDecrease && <TrendingDown className="h-3 w-3 text-red-500 inline" />}
                                                    {!isIncrease && !isDecrease && <Minus className="h-3 w-3 text-slate-400 inline" />}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {format(new Date(record.date), 'MMM d, yyyy')} • {record.source.replace(/_/g, ' ')}
                                        </div>
                                        {record.reason && (
                                            <p className="text-xs text-slate-600 mt-1 bg-slate-50 p-1.5 rounded">
                                                "{record.reason}"
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </ScrollArea>
        </div>
    );
};