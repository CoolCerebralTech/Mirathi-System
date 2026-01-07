import React, { useState } from 'react';
import { Plus, UserCheck, CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react';
import { 
  Button, 
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Badge,
  Alert,
  AlertDescription
} from '@/components/ui';
import { AddWitnessDialog } from './AddWitnessDialog';
import { EmptyState } from '@/components/common/EmptyState';
import type { WitnessResponse, WitnessStatus } from '@/types/estate.types';

interface WitnessListProps {
  willId: string;
  witnesses: WitnessResponse[];
}

export const WitnessList: React.FC<WitnessListProps> = ({ 
  willId, 
  witnesses 
}) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const getStatusBadge = (status: WitnessStatus) => {
    switch (status) {
      case 'SIGNED':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Signed
          </Badge>
        );
      case 'DECLINED':
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Declined
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="border-amber-400 text-amber-700">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getComplianceStatus = () => {
    const validWitnesses = witnesses.filter(
      w => w.isOver18 && w.isNotBeneficiary && w.isMentallyCapable
    );
    return {
      count: validWitnesses.length,
      isValid: validWitnesses.length >= 2,
    };
  };

  const compliance = getComplianceStatus();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Witnesses</h3>
          <p className="text-sm text-muted-foreground">
            Required: 2 • Current: {compliance.count}
          </p>
        </div>
        <Button 
          onClick={() => setIsAddDialogOpen(true)} 
          variant="outline" 
          size="sm"
          disabled={witnesses.length >= 3}
        >
          <Plus className="w-4 h-4 mr-2" /> Add Witness
        </Button>
      </div>

      {/* Compliance Alert */}
      {witnesses.length > 0 && !compliance.isValid && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <strong>Action Required:</strong> You need at least 2 valid witnesses for your will 
            to be legally binding. Please add {2 - compliance.count} more witness(es).
          </AlertDescription>
        </Alert>
      )}

      {witnesses.length > 0 && compliance.isValid && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-xs text-green-800">
            <strong>Witness Requirement Met:</strong> You have {compliance.count} valid 
            witness{compliance.count > 1 ? 'es' : ''} nominated. Your will meets the legal requirements.
          </AlertDescription>
        </Alert>
      )}

      {/* Witness Table or Empty State */}
      {witnesses.length === 0 ? (
        <EmptyState 
          title="No Witnesses Nominated"
          description="Your will requires at least 2 witnesses who are over 18, not beneficiaries, and will be present when you sign. Add your witnesses here."
          actionLabel="Add First Witness"
          onAction={() => setIsAddDialogOpen(true)}
          icon={<UserCheck className="h-12 w-12 text-muted-foreground" />}
        />
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Eligibility</TableHead>
                <TableHead>Signed Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {witnesses.map((witness) => (
                <TableRow key={witness.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="font-medium">{witness.fullName}</p>
                        {witness.nationalId && (
                          <p className="text-xs text-muted-foreground">
                            ID: {witness.nationalId}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="text-sm">
                      {witness.email && (
                        <p className="text-muted-foreground">{witness.email}</p>
                      )}
                      {witness.phoneNumber && (
                        <p className="text-muted-foreground">{witness.phoneNumber}</p>
                      )}
                      {!witness.email && !witness.phoneNumber && (
                        <span className="text-xs text-muted-foreground">No contact</span>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    {getStatusBadge(witness.status)}
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {witness.isOver18 && witness.isNotBeneficiary && witness.isMentallyCapable ? (
                        <Badge variant="outline" className="w-fit bg-green-50 text-green-700 border-green-300">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Eligible
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="w-fit bg-red-50 text-red-700 border-red-300">
                          <XCircle className="w-3 h-3 mr-1" />
                          Issues
                        </Badge>
                      )}
                      <div className="text-xs text-muted-foreground space-y-0.5">
                        {!witness.isOver18 && <p>• Under 18</p>}
                        {!witness.isNotBeneficiary && <p>• Is beneficiary</p>}
                        {!witness.isMentallyCapable && <p>• Not capable</p>}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(witness.signedAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Legal Notice */}
      {witnesses.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <strong>Section 13 Reminder:</strong> Witnesses must be present when you sign the will. 
            A witness who is also a beneficiary will forfeit their inheritance.
          </AlertDescription>
        </Alert>
      )}

      {/* Add Witness Dialog */}
      <AddWitnessDialog 
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        willId={willId}
      />
    </div>
  );
};