// pages/estate/EstateListPage.tsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui';
import { EstateStatusBadge } from '@/features/estate/components';

// Mock data - replace with actual API call
const mockEstates = [
  {
    id: '1',
    name: 'Estate of John Kamau',
    deceasedName: 'John Kamau',
    dateOfDeath: new Date('2024-01-15'),
    status: 'ACTIVE' as const,
    netWorth: { formatted: 'KES 12,500,000' },
    isFrozen: false,
    daysSinceDeath: 350,
  },
  {
    id: '2',
    name: 'Estate of Mary Wanjiku',
    deceasedName: 'Mary Wanjiku',
    dateOfDeath: new Date('2023-06-20'),
    status: 'DISTRIBUTING' as const,
    netWorth: { formatted: 'KES 8,200,000' },
    isFrozen: false,
    daysSinceDeath: 560,
  },
  {
    id: '3',
    name: 'Estate of Peter Ochieng',
    deceasedName: 'Peter Ochieng',
    dateOfDeath: new Date('2024-11-01'),
    status: 'FROZEN' as const,
    netWorth: { formatted: 'KES 5,100,000' },
    isFrozen: true,
    daysSinceDeath: 61,
  },
];

export const EstateListPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Estate Administration</h1>
              <p className="text-slate-600 mt-1">
                Manage and track all estate proceedings
              </p>
            </div>
            <Button 
              onClick={() => navigate('/estates/new')}
              className="bg-slate-900"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Estate
            </Button>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-4 items-center mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search estates by name or deceased..."
              className="pl-10"
            />
          </div>
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Estates</CardDescription>
              <CardTitle className="text-2xl">3</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Active</CardDescription>
              <CardTitle className="text-2xl text-green-600">1</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>In Distribution</CardDescription>
              <CardTitle className="text-2xl text-blue-600">1</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Frozen</CardDescription>
              <CardTitle className="text-2xl text-amber-600">1</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Estate List */}
        <div className="space-y-4">
          {mockEstates.map((estate) => (
            <Card
              key={estate.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/estates/${estate.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-xl">{estate.name}</CardTitle>
                      <EstateStatusBadge status={estate.status} isFrozen={estate.isFrozen} />
                    </div>
                    <CardDescription>
                      Deceased: {estate.deceasedName} • {estate.daysSinceDeath} days since death
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-slate-600">Net Worth</div>
                    <div className="text-lg font-semibold text-slate-900">
                      {estate.netWorth.formatted}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm">
                  <div className="text-slate-600">
                    Date of Death: {estate.dateOfDeath.toLocaleDateString()}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/estates/${estate.id}`);
                    }}
                  >
                    View Details →
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {mockEstates.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <div className="text-slate-400 mb-4">
                <Plus className="mx-auto h-12 w-12" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                No Estates Yet
              </h3>
              <p className="text-slate-600 mb-4">
                Get started by creating your first estate administration
              </p>
              <Button onClick={() => navigate('/estates/new')}>
                Create First Estate
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};