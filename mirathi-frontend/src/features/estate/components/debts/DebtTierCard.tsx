import React from 'react';
import { 
    Card, CardHeader, CardTitle, 
    Accordion, AccordionItem, AccordionTrigger, AccordionContent,
    Button, Badge, Progress
} from '../../../../components/ui';
import { MoneyDisplay } from '../shared/MoneyDisplay';
import { type DebtItemResponse } from '../../../../types/estate.types';
import { cn } from '../../../../lib/utils';

interface DebtTierCardProps {
    tierNumber: number;
    title: string;
    description: string;
    items: DebtItemResponse[];
    isLocked: boolean;
    onPayDebt: (debtId: string, item: DebtItemResponse) => void;
    onDispute: (debtId: string) => void;
}

export const DebtTierCard: React.FC<DebtTierCardProps> = ({ 
    tierNumber, title, description, items, isLocked, onPayDebt, onDispute 
}) => {
    const totalAmount = items.reduce((sum, item) => sum + item.originalAmount.amount, 0);
    const outstanding = items.reduce((sum, item) => sum + item.outstandingAmount.amount, 0);
    const paid = totalAmount - outstanding;
    const progress = totalAmount > 0 ? (paid / totalAmount) * 100 : 100;
    const isComplete = outstanding <= 0;

    return (
        <Card className={cn("border-l-4 overflow-hidden", 
            isComplete ? "border-l-green-500 bg-green-50/20" : 
            isLocked ? "border-l-slate-300 bg-slate-50 opacity-80" : "border-l-blue-500"
        )}>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold",
                            isComplete ? "bg-green-100 text-green-700" : 
                            isLocked ? "bg-slate-200 text-slate-500" : "bg-blue-100 text-blue-700"
                        )}>
                            {tierNumber}
                        </div>
                        <div>
                            <CardTitle className="text-base">{title}</CardTitle>
                            <p className="text-xs text-muted-foreground">{description}</p>
                        </div>
                    </div>
                    
                    <div className="text-right">
                        <div className="text-sm font-bold">
                            <MoneyDisplay amount={outstanding} currency="KES" colored />
                        </div>
                        <div className="text-xs text-muted-foreground">Outstanding</div>
                    </div>
                </div>
                
                {/* Progress Bar */}
                <div className="mt-2 space-y-1">
                    <Progress value={progress} className="h-1.5" />
                    <div className="flex justify-between text-[10px] text-muted-foreground uppercase font-medium">
                        <span>{isLocked ? "Locked - Pay Previous Tiers First" : isComplete ? "Fully Settled" : "In Progress"}</span>
                        <span>{Math.round(progress)}% Paid</span>
                    </div>
                </div>
            </CardHeader>

            <Accordion type="single" collapsible>
                <AccordionItem value="items" className="border-b-0">
                    <AccordionTrigger className="px-6 py-2 text-xs text-muted-foreground hover:no-underline hover:bg-slate-50">
                        View {items.length} {items.length === 1 ? 'Liability' : 'Liabilities'}
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-4 pt-2">
                         {items.length === 0 ? (
                            <p className="text-sm text-slate-500 italic py-2">No liabilities recorded in this tier.</p>
                         ) : (
                            <div className="space-y-3">
                                {items.map(item => (
                                    <div key={item.id} className="flex flex-col gap-2 rounded border p-3 bg-white">
                                        <div className="flex justify-between">
                                            <span className="font-semibold text-sm">{item.creditorName}</span>
                                            <Badge variant={item.status === 'PAID' ? "default" : "outline"}>
                                                {item.status.replace('_', ' ')}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground">{item.description}</p>
                                        
                                        <div className="flex items-center justify-between mt-1 pt-2 border-t">
                                            <span className="text-xs font-mono">
                                                Due: <MoneyDisplay amount={item.outstandingAmount} />
                                            </span>
                                            
                                            {!isLocked && item.status !== 'PAID' && (
                                                <div className="flex gap-2">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm" 
                                                        className="h-6 text-xs text-amber-600"
                                                        onClick={() => onDispute(item.id)}
                                                    >
                                                        Dispute
                                                    </Button>
                                                    <Button 
                                                        size="sm" 
                                                        className="h-6 text-xs"
                                                        onClick={() => onPayDebt(item.id, item)}
                                                    >
                                                        Pay
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                         )}
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </Card>
    );
};