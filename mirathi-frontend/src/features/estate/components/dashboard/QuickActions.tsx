// components/dashboard/QuickActions.tsx

import React from 'react';
import { 
  PlusCircle, 
  Banknote, 
  Users, 
  Gift 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { Button } from '@/components/ui';

interface QuickActionsProps {
  estateId: string;
  onAction: (actionType: 'ADD_ASSET' | 'ADD_DEBT' | 'FILE_CLAIM' | 'RECORD_GIFT') => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onAction }) => {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        
        <Button 
          variant="outline" 
          className="h-auto flex-col gap-2 py-4 hover:bg-slate-50 hover:border-blue-300 transition-all border-dashed"
          onClick={() => onAction('ADD_ASSET')}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            <PlusCircle className="h-5 w-5" />
          </div>
          <span className="font-medium text-slate-700">Add Asset</span>
        </Button>

        <Button 
          variant="outline" 
          className="h-auto flex-col gap-2 py-4 hover:bg-slate-50 hover:border-red-300 transition-all border-dashed"
          onClick={() => onAction('ADD_DEBT')}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600">
            <Banknote className="h-5 w-5" />
          </div>
          <span className="font-medium text-slate-700">Record Debt</span>
        </Button>

        <Button 
          variant="outline" 
          className="h-auto flex-col gap-2 py-4 hover:bg-slate-50 hover:border-amber-300 transition-all border-dashed"
          onClick={() => onAction('FILE_CLAIM')}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <Users className="h-5 w-5" />
          </div>
          <span className="font-medium text-slate-700">File Claim</span>
        </Button>

        <Button 
          variant="outline" 
          className="h-auto flex-col gap-2 py-4 hover:bg-slate-50 hover:border-purple-300 transition-all border-dashed"
          onClick={() => onAction('RECORD_GIFT')}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-600">
            <Gift className="h-5 w-5" />
          </div>
          <span className="font-medium text-slate-700">Record Gift</span>
        </Button>

      </CardContent>
    </Card>
  );
};