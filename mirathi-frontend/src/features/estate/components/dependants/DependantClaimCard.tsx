// components/dependants/DependantClaimCard.tsx

import { FileText, CheckCircle, XCircle, DollarSign, AlertTriangle, Info } from 'lucide-react';

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  Badge,
  Button,
  Progress,
  Alert,
  AlertTitle,
  AlertDescription,
  Separator,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui';

import { MoneyDisplay } from '../shared/MoneyDisplay';
import type { DependantItemResponse } from '@/types/estate.types';

interface DependantClaimCardProps {
  claim: DependantItemResponse;
  onVerify: () => void;
  onReject: () => void;
  onSettle: () => void;
  onAddEvidence: () => void;
  onViewDetails?: () => void;
  isLoading?: boolean;
}

export function DependantClaimCard({
  claim,
  onVerify,
  onReject,
  onSettle,
  onAddEvidence,
  onViewDetails,
  isLoading = false,
}: DependantClaimCardProps) {
  const evidenceProgress = claim.hasSufficientEvidence 
    ? 100 
    : Math.min((claim.evidenceCount / 3) * 100, 90); // Max 90% until sufficient

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-4">
        {/* Header with Name and Status */}
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{claim.name}</h3>
            
            {/* Badges */}
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="outline">
                {formatRelationship(claim.relationship)}
              </Badge>
              
              {claim.isMinor && (
                <Badge variant="warning">
                  Minor {claim.age && `(${claim.age})`}
                </Badge>
              )}
              
              {claim.isIncapacitated && (
                <Badge variant="destructive">
                  Incapacitated
                </Badge>
              )}
            </div>
          </div>
          
          {/* Status Badge */}
          <Badge variant={getStatusVariant(claim.status)} className="ml-2">
            {claim.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Risk Alert */}
        {claim.riskLevel === 'HIGH' && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>High Risk Claim</AlertTitle>
            <AlertDescription>
              {claim.isMinor && 'This is a minor dependant. '}
              {claim.isIncapacitated && 'This dependant is incapacitated. '}
              Requires special attention under S.29 LSA.
            </AlertDescription>
          </Alert>
        )}

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Monthly Needs */}
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <p className="text-sm text-muted-foreground">Monthly Needs</p>
              <HoverCard>
                <HoverCardTrigger asChild>
                  <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                </HoverCardTrigger>
                <HoverCardContent className="w-80">
                  <p className="text-sm">
                    Monthly maintenance requirements for this dependant as claimed under S.29 LSA.
                    This includes food, shelter, education, and medical care.
                  </p>
                </HoverCardContent>
              </HoverCard>
            </div>
            {/* --- FIX 1: Changed 'money' to 'amount' --- */}
            <MoneyDisplay 
              amount={claim.monthlyMaintenanceNeeds} 
              className="text-lg font-semibold"
            />
          </div>

          {/* Proposed Allocation */}
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Proposed Allocation</p>
            {claim.proposedAllocation ? (
              /* --- FIX 2: Changed 'money' to 'amount' --- */
              <MoneyDisplay 
                amount={claim.proposedAllocation} 
                className="text-lg font-semibold text-primary"
              />
            ) : (
              <span className="text-sm text-muted-foreground italic">Not yet determined</span>
            )}
          </div>
        </div>

        <Separator />

        {/* Evidence Status */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Supporting Evidence</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {claim.evidenceCount} document{claim.evidenceCount !== 1 ? 's' : ''}
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress value={evidenceProgress} className="h-2" />
            
            {claim.hasSufficientEvidence ? (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Sufficient evidence provided</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-amber-600">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm">
                  {claim.evidenceCount === 0 
                    ? 'No evidence submitted yet' 
                    : 'More evidence needed for verification'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Risk Level Indicator */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <span className="text-sm font-medium">Risk Assessment</span>
          <Badge 
            variant={
              claim.riskLevel === 'HIGH' 
                ? 'destructive' 
                : claim.riskLevel === 'MEDIUM' 
                  ? 'warning' 
                  : 'secondary'
            }
          >
            {claim.riskLevel} RISK
          </Badge>
        </div>
      </CardContent>

      {/* Actions Footer */}
      <CardFooter className="flex flex-col gap-2 pt-4">
        {/* Primary Actions based on Status */}
        <div className="flex gap-2 w-full">
          {claim.status === 'PENDING' && (
            <>
              <Button 
                onClick={onVerify}
                disabled={!claim.hasSufficientEvidence || isLoading}
                className="flex-1"
                size="sm"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Verify Claim
              </Button>
              <Button 
                onClick={onReject}
                variant="destructive"
                disabled={isLoading}
                className="flex-1"
                size="sm"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </Button>
            </>
          )}

          {claim.status === 'VERIFIED' && (
            <Button 
              onClick={onSettle}
              disabled={isLoading}
              className="flex-1"
              size="sm"
            >
              <DollarSign className="mr-2 h-4 w-4" />
              Settle Claim
            </Button>
          )}

          {claim.status === 'SETTLED' && (
            <div className="flex items-center justify-center gap-2 text-green-600 flex-1 py-2">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Claim Settled</span>
            </div>
          )}

          {claim.status === 'REJECTED' && (
            <div className="flex items-center justify-center gap-2 text-destructive flex-1 py-2">
              <XCircle className="h-5 w-5" />
              <span className="font-medium">Claim Rejected</span>
            </div>
          )}
        </div>

        {/* Secondary Actions */}
        <div className="flex gap-2 w-full">
          <Button 
            onClick={onAddEvidence}
            variant="outline"
            disabled={isLoading || claim.status === 'SETTLED' || claim.status === 'REJECTED'}
            className="flex-1"
            size="sm"
          >
            <FileText className="mr-2 h-4 w-4" />
            Add Evidence
          </Button>
          
          {onViewDetails && (
            <Button 
              onClick={onViewDetails}
              variant="ghost"
              disabled={isLoading}
              size="sm"
            >
              View Details
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}

// Helper Functions
function getStatusVariant(status: string): 'default' | 'warning' | 'success' | 'destructive' | 'secondary' {
  const statusMap: Record<string, 'default' | 'warning' | 'success' | 'destructive' | 'secondary'> = {
    PENDING: 'warning',
    VERIFIED: 'success',
    REJECTED: 'destructive',
    SETTLED: 'default',
  };
  return statusMap[status] || 'secondary';
}

function formatRelationship(relationship: string): string {
  const relationshipMap: Record<string, string> = {
    CHILD: 'Child',
    SPOUSE: 'Spouse',
    PARENT: 'Parent',
    GRANDCHILD: 'Grandchild',
    OTHER: 'Other Dependant',
  };
  return relationshipMap[relationship] || relationship;
}