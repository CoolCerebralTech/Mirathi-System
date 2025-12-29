import {
  ConsentMethod,
  ConsentStatus,
  FamilyRole,
} from '../../../../domain/entities/family-consent.entity';

export class ConsentItemVm {
  id: string;
  familyMemberId: string;
  fullName: string;
  role: FamilyRole;
  relationship: string;

  // Status
  status: ConsentStatus;
  isRequired: boolean;

  // Contact Info Status (Masked for privacy if needed)
  hasPhone: boolean;
  hasEmail: boolean;

  // Timeline
  requestSentAt?: Date;
  respondedAt?: Date;
  expiresAt?: Date;

  // Details
  method?: ConsentMethod;
  declineReason?: string;

  // UI Helpers
  canSendRequest: boolean;
  canMarkNotRequired: boolean;
}

export class ConsentMatrixVm {
  applicationId: string;

  // Statistics
  totalRequired: number;
  received: number;
  pending: number;
  declined: number;

  // Status Check
  isComplete: boolean;

  // List
  items: ConsentItemVm[];
}
