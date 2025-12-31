import React from 'react';
import { Shield, AlertTriangle, UserCheck, Baby } from 'lucide-react';
import { Badge } from '../../../components/ui';
import { cn } from '../../../lib/utils';
import { type LegalStatus } from '../../../types/family.types';

interface LegalStatusBadgeProps {
  status: LegalStatus;
  className?: string;
}

export const LegalStatusBadge: React.FC<LegalStatusBadgeProps> = ({ status, className }) => {
  if (status.isMinor) {
    return (
      <Badge variant="outline" className={cn("bg-amber-50 text-amber-700 border-amber-200 gap-1", className)}>
        <Baby className="w-3 h-3" />
        Minor {status.hasGuardian ? '(Guarded)' : '(No Guardian)'}
      </Badge>
    );
  }

  if (status.qualifiesForS29) {
    return (
      <Badge variant="outline" className={cn("bg-blue-50 text-blue-700 border-blue-200 gap-1", className)}>
        <Shield className="w-3 h-3" />
        S.29 Dependent
      </Badge>
    );
  }

  if (status.inheritanceEligibility === 'NONE') {
    return (
      <Badge variant="destructive" className={cn("gap-1", className)}>
        <AlertTriangle className="w-3 h-3" />
        Not Eligible
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className={cn("gap-1", className)}>
      <UserCheck className="w-3 h-3" />
      Beneficiary
    </Badge>
  );
};