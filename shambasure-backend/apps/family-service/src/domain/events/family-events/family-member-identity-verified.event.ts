// domain/events/family-events/family-member-identity-verified.event.ts
import { DomainEvent } from '../../base/domain-event';

// Move IdentityDocumentType here and export it
export enum IdentityDocumentType {
  NATIONAL_ID = 'NATIONAL_ID',
  PASSPORT = 'PASSPORT',
  KRA_PIN = 'KRA_PIN',
  BIRTH_CERTIFICATE = 'BIRTH_CERTIFICATE',
  DEATH_CERTIFICATE = 'DEATH_CERTIFICATE',
  ALIEN_ID = 'ALIEN_ID',
}

export interface FamilyMemberIdentityVerifiedEventPayload {
  familyMemberId: string;
  familyId: string;
  documentType: IdentityDocumentType;
  documentNumber: string;
  verifiedBy: string;
  verificationMethod: string;
  verificationDate: Date;
  timestamp: Date;
}

export class FamilyMemberIdentityVerifiedEvent extends DomainEvent<FamilyMemberIdentityVerifiedEventPayload> {
  constructor(payload: FamilyMemberIdentityVerifiedEventPayload) {
    super('FamilyMemberIdentityVerified', payload.familyMemberId, 'FamilyMember', payload);
  }
}
