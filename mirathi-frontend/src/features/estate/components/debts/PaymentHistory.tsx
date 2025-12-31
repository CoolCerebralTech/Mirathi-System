import React from 'react';
import { format } from 'date-fns';
import { ArrowUpRight, CheckCircle2, FileText } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, ScrollArea, Badge } from '../../../../components/ui';
import { MoneyDisplay } from '../shared/MoneyDisplay';
import { cn } from '../../../../lib/utils';

// Logic: We define an interface for a Payment Event. 
// In a real app, this would come from a specific GET /estate/{id}/payments endpoint
export interface PaymentRecord {
    id: string;
    debtName: string;
    amount: number;
    currency: string;
    date: string;
    method: string;
    reference?: string;
}

interface PaymentHistoryProps {
    payments?: PaymentRecord[]; // Made optional so it renders an empty state if data is missing
}

export const PaymentHistory: React.FC<PaymentHistoryProps> = ({ payments = [] }) => {
    return (
        <Card className="h-full">
            <CardHeader className="pb-3 border-b">
                <CardTitle className="text-base flex items-center gap-2">
                    <ArrowUpRight className="h-5 w-5 text-slate-500" />
                    Payment Outflows
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <ScrollArea className="h-[300px]">
                    {payments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm">
                            <FileText className="h-8 w-8 mb-2 opacity-20" />
                            No payments recorded yet.
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {payments.map((payment, i) => (
                                <div key={payment.id} className={cn(
                                    "flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors",
                                    i !== payments.length - 1 && "border-b border-slate-100"
                                )}>
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600">
                                            <CheckCircle2 className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-900">{payment.debtName}</p>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <span>{format(new Date(payment.date), 'MMM d, yyyy')}</span>
                                                <span>•</span>
                                                <span className="capitalize">{payment.method}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-slate-900">
                                            <MoneyDisplay amount={{ amount: payment.amount, currency: payment.currency }} />
                                        </div>
                                        {payment.reference && (
                                            <Badge variant="outline" className="text-[10px] h-5 font-normal text-slate-500">
                                                #{payment.reference}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </CardContent>
        </Card>
    );
};