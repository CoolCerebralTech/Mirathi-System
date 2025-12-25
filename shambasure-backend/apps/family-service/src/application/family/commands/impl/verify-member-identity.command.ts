import { BaseCommand } from '../../../common/base/base.command';

/**
 * Command to verify a family member's identity against official documents.
 *
 * Investor Note / KYM (Know Your Member):
 * This is the "Gold Standard" feature. A family tree with 'VERIFIED' members
 * is trusted by the Judiciary for succession. Unverified trees are just hearsay.
 *
 * This command is usually triggered after:
 * 1. An IPRS (Integrated Population Registration System) check.
 * 2. Manual upload and review of a National ID scan.
 */
export class VerifyMemberIdentityCommand extends BaseCommand {
  public readonly familyId: string;
  public readonly memberId: string;

  // Verification Result
  public readonly isValid: boolean;
  public readonly verificationMethod: 'IPRS_CHECK' | 'MANUAL_DOCUMENT_REVIEW' | 'TRUSTED_AGENT';
  public readonly documentId?: string; // Link to uploaded ID scan
  public readonly notes?: string; // e.g., "Name matches, DOB off by 1 day"

  // Optional: Update ID number during verification if previously missing
  public readonly correctedNationalId?: string;

  constructor(props: {
    userId: string; // The Agent or System Admin doing the verifying
    familyId: string;
    memberId: string;
    isValid: boolean;
    verificationMethod: 'IPRS_CHECK' | 'MANUAL_DOCUMENT_REVIEW' | 'TRUSTED_AGENT';
    documentId?: string;
    notes?: string;
    correctedNationalId?: string;
    correlationId?: string;
  }) {
    super({ userId: props.userId, correlationId: props.correlationId });
    this.familyId = props.familyId;
    this.memberId = props.memberId;
    this.isValid = props.isValid;
    this.verificationMethod = props.verificationMethod;
    this.documentId = props.documentId;
    this.notes = props.notes;
    this.correctedNationalId = props.correctedNationalId;
  }

  public validate(): void {
    super.validate();
    if (!this.familyId) throw new Error('Family ID is required');
    if (!this.memberId) throw new Error('Member ID is required');
    if (!this.verificationMethod) throw new Error('Verification Method is required');
  }
}
