import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  TrendingUp, 
  Gavel, 
  Edit, 
  Lock 
} from 'lucide-react';

import { 
  Button, 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Label} from '../../components/ui';
import { LoadingSpinner } from '../../components/common';
import { MoneyDisplay } from '../../features/estate/components/shared/MoneyDisplay';

// Components
import { ValuationHistory } from '../../features/estate/components/assets/ValuationHistory';
import { CoOwnershipPanel } from '../../features/estate/components/assets/CoOwnershipPanel';
import { InitiateLiquidationDialog } from '../../features/estate/dialogs/InitiateLiquidationDialog';

// API
import { 
  useAssetDetails, 
  useUpdateAssetValuation, 
  useAddAssetCoOwner 
} from '../../features/estate/estate.api';
import { ValuationSource, CoOwnershipType } from '../../types/estate.types';

export const AssetDetailsPage: React.FC = () => {
  const { id: estateId, assetId } = useParams<{ id: string; assetId: string }>();
  const navigate = useNavigate();
  
  // Dialog States
  const [isLiquidationOpen, setIsLiquidationOpen] = useState(false);
  const [isValuationOpen, setIsValuationOpen] = useState(false);
  const [isCoOwnerOpen, setIsCoOwnerOpen] = useState(false);

  // Data Fetching
  const { data: asset, isLoading } = useAssetDetails(estateId!, assetId!);

  if (isLoading || !asset) {
    return <div className="h-screen flex items-center justify-center"><LoadingSpinner /></div>;
  }

  // Helper to render specific details based on type
  const renderSpecificDetails = () => {
    // In a real implementation, map specific fields from asset.landDetails etc.
    // This is a simplified view for the layout
    return (
        <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
                <span className="text-muted-foreground">Category</span>
                <p className="font-medium">{asset.type}</p>
            </div>
            <div className="space-y-1">
                <span className="text-muted-foreground">Identifier</span>
                <p className="font-medium">{asset.identifier || 'N/A'}</p>
            </div>
            {asset.location && (
                <div className="col-span-2 space-y-1">
                    <span className="text-muted-foreground">Location</span>
                    <p className="font-medium">{asset.location}</p>
                </div>
            )}
            {asset.description && (
                <div className="col-span-2 space-y-1">
                    <span className="text-muted-foreground">Description</span>
                    <p className="text-muted-foreground">{asset.description}</p>
                </div>
            )}
        </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 p-6 bg-slate-50/50 min-h-screen">
      
      {/* 1. Navigation & Header */}
      <div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="mb-4 pl-0 hover:bg-transparent hover:text-primary"
          onClick={() => navigate(`/estates/${estateId}`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>
        
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
             <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">{asset.name}</h1>
                <Badge variant={asset.status === 'ACTIVE' ? 'default' : 'secondary'}>
                    {asset.status.replace('_', ' ')}
                </Badge>
             </div>
             <p className="text-muted-foreground mt-1 flex items-center gap-2">
                {asset.type} • {asset.identifier}
                {asset.isEncumbered && (
                    <Badge variant="outline" className="text-amber-600 border-amber-200 text-[10px]">
                        <Lock className="w-3 h-3 mr-1" /> Encumbered
                    </Badge>
                )}
             </p>
          </div>

          <div className="flex items-center gap-2">
             <Button variant="outline" onClick={() => setIsValuationOpen(true)}>
                <TrendingUp className="mr-2 h-4 w-4" /> Re-Value
             </Button>
             <Button variant="destructive" onClick={() => setIsLiquidationOpen(true)}>
                <Gavel className="mr-2 h-4 w-4" /> Liquidate
             </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        
        {/* Left Column: Details & Ownership (8 cols) */}
        <div className="space-y-6 md:col-span-8">
            
            {/* Main Details */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base">Asset Details</CardTitle>
                    <Button variant="ghost" size="sm"><Edit className="h-4 w-4" /></Button>
                </CardHeader>
                <CardContent>
                    {renderSpecificDetails()}
                </CardContent>
            </Card>

            {/* Ownership */}
            <CoOwnershipPanel 
                assetValue={asset.currentValue.amount} 
                currency={asset.currentValue.currency}
                estateSharePercentage={asset.estateSharePercentage}
                onAddOwner={() => setIsCoOwnerOpen(true)}
                // owners={asset.coOwners} // Pass real owners array here
            />

            {/* Liquidation Status (If active) */}
            {/* This would conditionally render if status === 'LIQUIDATING' or 'SOLD' */}
            {/* <LiquidationCard ... /> */}

        </div>

        {/* Right Column: Value & History (4 cols) */}
        <div className="space-y-6 md:col-span-4">
            
            {/* Current Value Widget */}
            <Card className="border-l-4 border-l-green-500">
                <CardContent className="pt-6">
                    <span className="text-sm text-muted-foreground font-medium uppercase">Current Market Value</span>
                    <div className="text-3xl font-bold mt-1">
                        <MoneyDisplay amount={asset.currentValue} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                        Last updated recently via User Estimate.
                    </p>
                </CardContent>
            </Card>

            {/* Valuation History */}
            <Card>
                <CardContent className="pt-6">
                    <ValuationHistory />
                </CardContent>
            </Card>

        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Local Dialogs */}
      {/* ------------------------------------------------------------------ */}

      <InitiateLiquidationDialog 
        open={isLiquidationOpen}
        onOpenChange={setIsLiquidationOpen}
        estateId={estateId!}
        assetId={assetId!}
      />

      {/* Simple Update Valuation Dialog */}
      <UpdateValuationDialog 
        open={isValuationOpen}
        onOpenChange={setIsValuationOpen}
        estateId={estateId!}
        assetId={assetId!}
        currentValue={asset.currentValue.amount}
      />

      {/* Simple Add Co-Owner Dialog */}
      <AddCoOwnerDialog
        open={isCoOwnerOpen}
        onOpenChange={setIsCoOwnerOpen}
        estateId={estateId!}
        assetId={assetId!}
      />

    </div>
  );
};

// --- Local Dialog Components for Cleaner Page Code ---

const UpdateValuationDialog = ({ open, onOpenChange, estateId, assetId, currentValue }: any) => {
    const { mutate } = useUpdateAssetValuation(estateId, assetId);
    const [amount, setAmount] = useState(currentValue);
    const [reason, setReason] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutate({ 
            newValue: { amount: parseFloat(amount), currency: 'KES' }, 
            source: ValuationSource.USER_ESTIMATE, 
            reason 
        });
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader><DialogTitle>Update Valuation</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>New Value (KES)</Label>
                        <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>Reason / Source</Label>
                        <Input placeholder="e.g. New market assessment" value={reason} onChange={e => setReason(e.target.value)} />
                    </div>
                    <Button type="submit" className="w-full">Update Value</Button>
                </form>
            </DialogContent>
        </Dialog>
    );
};

const AddCoOwnerDialog = ({ open, onOpenChange, estateId, assetId }: any) => {
    const { mutate } = useAddAssetCoOwner(estateId, assetId);
    // Simplified for demo - normally needs Member Select
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Mock data submission
        mutate({ 
            familyMemberId: 'uuid', 
            sharePercentage: 50, 
            ownershipType: CoOwnershipType.JOINT_TENANCY 
        });
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader><DialogTitle>Add Co-Owner</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Select a family member who shares ownership of this asset.
                    </p>
                    {/* Placeholder for Member Select */}
                    <div className="space-y-2">
                        <Label>Share Percentage (%)</Label>
                        <Input type="number" placeholder="50" />
                    </div>
                    <Button type="submit" className="w-full">Add Owner</Button>
                </form>
            </DialogContent>
        </Dialog>
    );
};