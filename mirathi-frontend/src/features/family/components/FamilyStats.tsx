import React from 'react';
import { Users, UserMinus, UserCheck, GitFork } from 'lucide-react';
import { Card, CardContent } from '@/components/ui';
import { type FamilyStats as FamilyStatsType } from '@/types/family.types';

interface FamilyStatsProps {
  stats: FamilyStatsType;
}

export const FamilyStats: React.FC<FamilyStatsProps> = ({ stats }) => {
  const items = [
    {
      label: 'Total Members',
      value: stats.totalMembers,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
    {
      label: 'Verified',
      value: stats.verifiedMembers,
      icon: UserCheck,
      color: 'text-green-600',
      bg: 'bg-green-100',
    },
    {
      label: 'Deceased',
      value: stats.deceasedMembers,
      icon: UserMinus,
      color: 'text-slate-600',
      bg: 'bg-slate-100',
    },
    {
      label: 'Generations',
      value: stats.generationsCount,
      icon: GitFork,
      color: 'text-purple-600',
      bg: 'bg-purple-100',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label}>
          <CardContent className="flex items-center gap-4 p-6">
            <div className={`rounded-full p-3 ${item.bg}`}>
              <item.icon className={`h-6 w-6 ${item.color}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {item.label}
              </p>
              <h3 className="text-2xl font-bold">{item.value}</h3>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};