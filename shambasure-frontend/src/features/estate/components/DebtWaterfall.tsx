import { AlertCircle, CheckCircle2, Lock, ArrowDown } from 'lucide-react';
import { useDebtWaterfall } from '../estate.api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../../components/ui/Accordion';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import { DebtItemResponse } from '../estate.types';

interface DebtWaterfallProps {
  estateId: string;
}

export function DebtWaterfall({ estateId }: DebtWaterfallProps) {
  const { data, isLoading } = useDebtWaterfall(estateId);

  if (isLoading) return <LoadingSpinner />;
  if (!data) return null;

  const tiers = [
    { id: 1, name: 'Funeral Expenses', items: data.tier1_FuneralExpenses, color: 'bg-red-100 border-red-200' },
    { id: 2, name: 'Testamentary Expenses', items: data.tier2_Testamentary, color: 'bg-orange-100 border-orange-200' },
    { id: 3, name: 'Secured Debts', items: data.tier3_SecuredDebts, color: 'bg-yellow-100 border-yellow-200' },
    { id: 4, name: 'Taxes & Wages', items: data.tier4_TaxesAndWages, color: 'bg-blue-100 border-blue-200' },
    { id: 5, name: 'Unsecured Debts', items: data.tier5_Unsecured, color: 'bg-slate-100 border-slate-200' },
  ];

  return (
    <div className="space-y-6">
      <Card className="border-l-4 border-l-primary">
        <CardHeader>
          <CardTitle>Section 45 Priority Waterfall</CardTitle>
          <CardDescription>
            Debts must be settled in this strict order. You cannot pay lower tiers if higher tiers are outstanding.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="relative">
        {tiers.map((tier, index) => (
          <div key={tier.id} className="relative pb-8 last:pb-0">
            {/* Connector Line */}
            {index !== tiers.length - 1 && (
              <div className="absolute top-10 left-6 -ml-px h-full w-0.5 bg-slate-200" aria-hidden="true" />
            )}

            <div className={`relative flex items-start group ${data.highestPriorityOutstanding === tier.id ? 'opacity-100' : 'opacity-80'}`}>
              <span className={`flex h-12 w-12 items-center justify-center rounded-full border bg-white shadow-sm shrink-0 z-10`}>
                 <span className="font-bold text-lg">{tier.id}</span>
              </span>
              
              <div className="ml-4 w-full">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value={`tier-${tier.id}`} className={`border rounded-md px-4 ${tier.color}`}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex flex-1 items-center justify-between pr-4">
                        <div className="flex flex-col items-start">
                          <span className="font-semibold text-slate-900">{tier.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {tier.items.filter(i => i.status !== 'PAID').length} Outstanding
                          </span>
                        </div>
                        {data.highestPriorityOutstanding === tier.id && (
                           <Badge variant="destructive" className="animate-pulse">Current Priority</Badge>
                        )}
                        {data.highestPriorityOutstanding > tier.id && (
                           <Badge variant="secondary" className="bg-green-100 text-green-700">
                             <CheckCircle2 className="w-3 h-3 mr-1" /> Cleared
                           </Badge>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 pt-2">
                        {tier.items.length === 0 && <p className="text-sm text-muted-foreground italic">No debts in this tier.</p>}
                        {tier.items.map((debt) => (
                          <DebtItemCard key={debt.id} debt={debt} />
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </div>
            
            {/* Arrow */}
            {index !== tiers.length - 1 && (
               <div className="absolute left-6 ml-[-6px] bottom-0 text-slate-300">
                 <ArrowDown className="h-4 w-4" />
               </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function DebtItemCard({ debt }: { debt: DebtItemResponse }) {
  return (
    <div className="bg-white p-3 rounded border shadow-sm flex justify-between items-center">
      <div>
        <p className="font-medium text-sm">{debt.creditorName}</p>
        <p className="text-xs text-muted-foreground">{debt.description}</p>
        {debt.isSecured && (
          <Badge variant="outline" className="mt-1 text-[10px]"><Lock className="h-3 w-3 mr-1" /> Secured</Badge>
        )}
      </div>
      <div className="text-right">
        <p className="font-bold text-sm">{debt.outstandingAmount.formatted}</p>
        <Badge className={`text-[10px] ${debt.status === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}`}>
          {debt.status.replace('_', ' ')}
        </Badge>
      </div>
    </div>
  );
}