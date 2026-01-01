// pages/estate/AssetDetailsPage.tsx

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui';
import { Badge } from '@/components/ui';
import { Separator } from '@/components/ui';
import { useAssetDetails } from '@/features/estate/estate.api';
import {
  MoneyDisplay,
  AssetTypeFields,
  ValuationHistory,
  CoOwnershipPanel,
} from '@/features/estate/components';
import { InitiateLiquidationDialog } from '@/features/estate/dialogs';

export const AssetDetailsPage: React.FC = () => {
  const { estateId, assetId } = useParams<{ estateId: string; assetId: string }>();
  const navigate = useNavigate();

  const { data: asset, isLoading } = useAssetDetails(estateId!, assetId!);

  if (!estateId || !assetId) {
    navigate('/estates');
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-slate-600 mb-4" />
          <p className="text-slate-600">Loading asset details...</p>
        </div>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 mb-4">Asset not found</p>
          <Button onClick={() => navigate(`/estates/${estateId}`)}>
            Back to Estate
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/estates/${estateId}`)}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Estate
          </Button>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-slate-900">{asset.name}</h1>
                <Badge variant={asset.status === 'ACTIVE' ? 'default' : 'secondary'}>
                  {asset.status}
                </Badge>
                {asset.isEncumbered && (
                  <Badge variant="destructive">Encumbered</Badge>
                )}
              </div>
              <p className="text-slate-600">
                {asset.type.replace('_', ' ')} • {asset.identifier}
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <InitiateLiquidationDialog
                estateId={estateId}
                preselectedAssetId={assetId}
                trigger={
                  <Button variant="destructive" size="sm">
                    Liquidate
                  </Button>
                }
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Valuation Card */}
            <Card>
              <CardHeader>
                <CardTitle>Current Valuation</CardTitle>
                <CardDescription>
                  Latest assessed value of this asset
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-slate-600 mb-1">Market Value</div>
                    <MoneyDisplay
                      amount={asset.currentValue.amount}
                      currency={asset.currentValue.currency}
                      className="text-3xl font-bold"
                    />
                  </div>

                  {asset.isCoOwned && (
                    <div className="pt-4 border-t">
                      <div className="text-sm text-slate-600 mb-1">Estate Share</div>
                      <div className="text-lg font-semibold">
                        {asset.estateSharePercentage}% ({' '}
                        <MoneyDisplay
                          amount={asset.currentValue.amount * (asset.estateSharePercentage / 100)}
                          currency={asset.currentValue.currency}
                        />
                        )
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Asset Details Card */}
            <Card>
              <CardHeader>
                <CardTitle>Asset Details</CardTitle>
              </CardHeader>
              <CardContent>
                {asset.description && (
                  <div className="mb-4">
                    <div className="text-sm font-medium text-slate-700 mb-1">Description</div>
                    <p className="text-slate-600">{asset.description}</p>
                  </div>
                )}

                {asset.location && (
                  <div className="mb-4">
                    <div className="text-sm font-medium text-slate-700 mb-1">Location</div>
                    <p className="text-slate-600">{asset.location}</p>
                  </div>
                )}

                <Separator className="my-4" />

                {/* Type-specific fields */}
                <AssetTypeFields asset={asset} />
              </CardContent>
            </Card>

            {/* Valuation History */}
            <Card>
              <CardHeader>
                <CardTitle>Valuation History</CardTitle>
                <CardDescription>
                  Track changes in asset value over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ValuationHistory assetId={assetId} estateId={estateId} />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <div className="text-slate-600">Current Status</div>
                  <div className="font-semibold">{asset.status}</div>
                </div>

                {asset.isEncumbered && (
                  <div>
                    <div className="text-slate-600">Encumbrance</div>
                    <div className="font-semibold text-red-600">
                      {asset.encumbranceDetails || 'Secured as collateral'}
                    </div>
                  </div>
                )}

                {asset.isCoOwned && (
                  <div>
                    <div className="text-slate-600">Ownership</div>
                    <div className="font-semibold">Co-owned</div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Co-ownership Panel */}
            {asset.isCoOwned && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Co-Owners</CardTitle>
                </CardHeader>
                <CardContent>
                  <CoOwnershipPanel assetId={assetId} estateId={estateId} />
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Edit className="mr-2 h-4 w-4" />
                  Update Valuation
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Add Co-Owner
                </Button>
                <InitiateLiquidationDialog
                  estateId={estateId}
                  preselectedAssetId={assetId}
                  trigger={
                    <Button variant="destructive" className="w-full justify-start">
                      Initiate Liquidation
                    </Button>
                  }
                />
                <Separator className="my-2" />
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove Asset
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};