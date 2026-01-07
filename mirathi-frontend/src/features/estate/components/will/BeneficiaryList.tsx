import React, { useState } from 'react';
import { Plus, Gift, Percent, Coins, Package } from 'lucide-react';
import { 
  Button, 
  Badge,
  Card,
  CardContent
} from '@/components/ui';
import { AddBeneficiaryDialog } from './AddBeneficiaryDialog';
import { EmptyState } from '@/components/common/EmptyState';
import type { BeneficiaryResponse, BequestType } from '@/types/estate.types';

interface BeneficiaryListProps {
  willId: string;
  beneficiaries: BeneficiaryResponse[];
}

export const BeneficiaryList: React.FC<BeneficiaryListProps> = ({ 
  willId, 
  beneficiaries 
}) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getBequestIcon = (type: BequestType) => {
    switch (type) {
      case 'PERCENTAGE':
        return <Percent className="w-4 h-4 text-blue-600" />;
      case 'CASH_AMOUNT':
        return <Coins className="w-4 h-4 text-green-600" />;
      case 'SPECIFIC_ASSET':
        return <Package className="w-4 h-4 text-orange-600" />;
      default:
        return <Gift className="w-4 h-4 text-purple-600" />;
    }
  };

  const getBequestDisplay = (beneficiary: BeneficiaryResponse): string => {
    switch (beneficiary.bequestType) {
      case 'PERCENTAGE':
        return beneficiary.percentage 
          ? `${beneficiary.percentage}% of estate` 
          : 'Percentage bequest';
      case 'CASH_AMOUNT':
        return beneficiary.cashAmount 
          ? formatCurrency(beneficiary.cashAmount) 
          : 'Cash bequest';
      case 'SPECIFIC_ASSET':
        return 'Specific asset';
      case 'RESIDUAL':
        return 'Residual estate';
      default:
        return 'Bequest';
    }
  };

  const getBequestTypeBadge = (type: BequestType) => {
    const variants: Record<BequestType, { color: string; label: string }> = {
      PERCENTAGE: { color: 'bg-blue-100 text-blue-800', label: 'Percentage' },
      CASH_AMOUNT: { color: 'bg-green-100 text-green-800', label: 'Cash' },
      SPECIFIC_ASSET: { color: 'bg-orange-100 text-orange-800', label: 'Asset' },
      RESIDUAL: { color: 'bg-purple-100 text-purple-800', label: 'Residual' },
    };

    const variant = variants[type];
    return (
      <Badge className={`${variant.color} hover:${variant.color}`}>
        {variant.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Beneficiaries</h3>
          <p className="text-sm text-muted-foreground">
            {beneficiaries.length} beneficiar{beneficiaries.length === 1 ? 'y' : 'ies'} designated
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} variant="outline" size="sm">
          <Plus className="w-4 h-4 mr-2" /> Add Beneficiary
        </Button>
      </div>

      {/* Beneficiary Cards or Empty State */}
      {beneficiaries.length === 0 ? (
        <EmptyState 
          title="No Beneficiaries Yet"
          description="Add beneficiaries to specify who will inherit your estate. You can designate specific assets, percentages, or cash amounts."
          actionLabel="Add First Beneficiary"
          onAction={() => setIsAddDialogOpen(true)}
          icon={<Gift className="h-12 w-12 text-muted-foreground" />}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {beneficiaries.map((beneficiary) => (
            <Card 
              key={beneficiary.id} 
              className="hover:shadow-md transition-shadow border-l-4 border-l-purple-400"
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="p-2.5 bg-purple-50 rounded-lg flex-shrink-0">
                    {getBequestIcon(beneficiary.bequestType)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <h4 className="font-semibold text-base leading-tight">
                          {beneficiary.beneficiaryName}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {beneficiary.beneficiaryType}
                          {beneficiary.relationship && ` • ${beneficiary.relationship}`}
                        </p>
                      </div>
                      {getBequestTypeBadge(beneficiary.bequestType)}
                    </div>

                    {/* Bequest Details */}
                    <div className="bg-muted/50 rounded-md p-3 mb-2">
                      <p className="text-sm font-medium text-foreground">
                        {getBequestDisplay(beneficiary)}
                      </p>
                      {beneficiary.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {beneficiary.description}
                        </p>
                      )}
                    </div>

                    {/* Conditions Badge */}
                    {beneficiary.hasConditions && beneficiary.conditions && (
                      <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded">
                        <span className="font-medium">Conditions apply:</span>
                        <span className="line-clamp-1">{beneficiary.conditions}</span>
                      </div>
                    )}

                    {/* Asset Link */}
                    {beneficiary.assetId && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Linked to asset: {beneficiary.assetId}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {beneficiaries.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
            <p className="text-xs text-purple-700 font-medium">Residual</p>
            <p className="text-lg font-bold text-purple-900">
              {beneficiaries.filter(b => b.bequestType === 'RESIDUAL').length}
            </p>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-700 font-medium">Percentage</p>
            <p className="text-lg font-bold text-blue-900">
              {beneficiaries.filter(b => b.bequestType === 'PERCENTAGE').length}
            </p>
          </div>
          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
            <p className="text-xs text-green-700 font-medium">Cash</p>
            <p className="text-lg font-bold text-green-900">
              {beneficiaries.filter(b => b.bequestType === 'CASH_AMOUNT').length}
            </p>
          </div>
          <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
            <p className="text-xs text-orange-700 font-medium">Specific</p>
            <p className="text-lg font-bold text-orange-900">
              {beneficiaries.filter(b => b.bequestType === 'SPECIFIC_ASSET').length}
            </p>
          </div>
        </div>
      )}

      {/* Add Dialog */}
      <AddBeneficiaryDialog 
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        willId={willId}
      />
    </div>
  );
};