import React from 'react';
import { 
  PlusCircle, 
  MinusCircle, 
  FileText, 
  Gavel, 
  Banknote,
  Gift
} from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardContent } from '../../../../components/ui';

interface QuickActionsProps {
  onAction: (action: string) => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onAction }) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2 lg:grid-cols-1">
        
        <Button 
            variant="outline" 
            className="justify-start h-auto py-3 px-4 border-dashed border-2 hover:border-solid hover:border-green-300 hover:bg-green-50"
            onClick={() => onAction('ADD_ASSET')}
        >
            <div className="mr-3 rounded-full bg-green-100 p-2 text-green-600">
                <PlusCircle className="h-4 w-4" />
            </div>
            <div className="text-left">
                <div className="text-sm font-semibold">Record Asset</div>
                <div className="text-[10px] text-muted-foreground">Add land, vehicle, or cash</div>
            </div>
        </Button>

        <Button 
            variant="outline" 
            className="justify-start h-auto py-3 px-4 border-dashed border-2 hover:border-solid hover:border-red-300 hover:bg-red-50"
            onClick={() => onAction('ADD_DEBT')}
        >
            <div className="mr-3 rounded-full bg-red-100 p-2 text-red-600">
                <MinusCircle className="h-4 w-4" />
            </div>
            <div className="text-left">
                <div className="text-sm font-semibold">Add Liability</div>
                <div className="text-[10px] text-muted-foreground">Record debt or expense</div>
            </div>
        </Button>

        <div className="grid grid-cols-2 gap-2 mt-2">
            <Button variant="ghost" size="sm" className="justify-start text-xs" onClick={() => onAction('PAY_DEBT')}>
                <Banknote className="mr-2 h-3.5 w-3.5 text-slate-500" /> Pay Debt
            </Button>
            <Button variant="ghost" size="sm" className="justify-start text-xs" onClick={() => onAction('ADD_GIFT')}>
                <Gift className="mr-2 h-3.5 w-3.5 text-slate-500" /> S.35 Gift
            </Button>
            <Button variant="ghost" size="sm" className="justify-start text-xs" onClick={() => onAction('FILE_CLAIM')}>
                <Gavel className="mr-2 h-3.5 w-3.5 text-slate-500" /> S.29 Claim
            </Button>
            <Button variant="ghost" size="sm" className="justify-start text-xs" onClick={() => onAction('TAX_PAYMENT')}>
                <FileText className="mr-2 h-3.5 w-3.5 text-slate-500" /> Tax Filing
            </Button>
        </div>

      </CardContent>
    </Card>
  );
};