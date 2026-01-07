import React from 'react';
import { Plus, FileText, Users, Scale, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button } from '@/components/ui';

interface QuickActionsCardProps {
  onAddAsset: () => void;
  onAddDebt: () => void;
  onCreateWill: () => void;
  onViewLegal: () => void;
}

export const QuickActionsCard: React.FC<QuickActionsCardProps> = ({
  onAddAsset,
  onAddDebt,
  onCreateWill,
  onViewLegal,
}) => {
  const actions = [
    {
      icon: TrendingUp,
      label: 'Add Asset',
      description: 'Record property, vehicle, or account',
      onClick: onAddAsset,
      color: 'text-green-600',
      bgColor: 'bg-green-50 hover:bg-green-100',
    },
    {
      icon: Scale,
      label: 'Record Debt',
      description: 'Log liability or obligation',
      onClick: onAddDebt,
      color: 'text-red-600',
      bgColor: 'bg-red-50 hover:bg-red-100',
    },
    {
      icon: FileText,
      label: 'Create Will',
      description: 'Start succession planning',
      onClick: onCreateWill,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 hover:bg-purple-100',
    },
    {
      icon: Users,
      label: 'Legal Insights',
      description: 'View recommendations',
      onClick: onViewLegal,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 hover:bg-blue-100',
    },
  ];

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Plus className="h-5 w-5 text-primary" />
          Quick Actions
        </CardTitle>
        <CardDescription>Common estate management tasks</CardDescription>
      </CardHeader>
      
      <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {actions.map((action, index) => (
          <Button
            key={index}
            variant="outline"
            className={`h-auto flex-col items-start p-4 ${action.bgColor} border-2 hover:border-primary/50 transition-all`}
            onClick={action.onClick}
          >
            <div className="flex items-center gap-2 w-full mb-2">
              <div className={`p-2 rounded-lg bg-white ${action.color}`}>
                <action.icon className="h-5 w-5" />
              </div>
              <span className="font-semibold text-foreground">{action.label}</span>
            </div>
            <span className="text-xs text-muted-foreground text-left">
              {action.description}
            </span>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
};