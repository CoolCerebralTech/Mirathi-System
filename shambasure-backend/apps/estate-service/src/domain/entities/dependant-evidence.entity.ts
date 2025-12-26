// src/estate-service/src/domain/entities/dependant-evidence.entity.ts
import { Entity } from '../base/entity';
import { UniqueEntityID } from '../base/unique-entity-id';
import { EvidenceType, EvidenceTypeHelper } from '../enums/evidence-type.enum';

// We'll create this next

export interface DependantEvidenceProps {
  dependantId: string;
  type: EvidenceType;
  documentUrl: string;
  description: string;
  isVerified: boolean;
  verifiedBy?: string;
  verifiedAt?: Date;

  // Metadata
  uploadedBy: string;
  uploadedAt: Date;
  expiresAt?: Date; // Some evidence has expiry dates
  isExpired: boolean;

  // Validation
  validationNotes?: string;
  validationScore: number; // 0-100 credibility score
}

/**
 * Dependant Evidence Entity
 *
 * Represents documentary evidence for a dependant claim.
 * Child entity of LegalDependant.
 *
 * BUSINESS RULES:
 * 1. Expired evidence is not valid
 * 2. Evidence must be verified by authorized personnel
 * 3. Different evidence types have different credibility scores
 * 4. Multiple pieces of evidence increase claim strength
 */
export class DependantEvidence extends Entity<DependantEvidenceProps> {
  private constructor(props: DependantEvidenceProps, id?: UniqueEntityID) {
    super(id || new UniqueEntityID(), props);
    this.validate();
  }

  /**
   * Factory method to create new evidence
   */
  public static create(
    props: Omit<
      DependantEvidenceProps,
      'isVerified' | 'isExpired' | 'validationScore' | 'uploadedAt'
    >,
    id?: UniqueEntityID,
  ): DependantEvidence {
    const validationScore = EvidenceTypeHelper.getBaseCredibilityScore(props.type);
    const uploadedAt = new Date();

    // Check if evidence has expiry
    const expiresAt = EvidenceTypeHelper.getExpiryDate(props.type);
    const isExpired = expiresAt ? expiresAt < new Date() : false;

    return new DependantEvidence(
      {
        ...props,
        isVerified: false,
        isExpired,
        validationScore,
        uploadedAt,
      },
      id,
    );
  }

  /**
   * Factory for marriage certificate evidence
   */
  public static createMarriageCertificate(
    dependantId: string,
    documentUrl: string,
    description: string,
    uploadedBy: string,
    marriageDate?: Date,
  ): DependantEvidence {
    return DependantEvidence.create({
      dependantId,
      type: EvidenceType.MARRIAGE_CERTIFICATE,
      documentUrl,
      description: `${description}. Marriage date: ${marriageDate?.toISOString() || 'unknown'}`,
      uploadedBy,
    });
  }

  /**
   * Factory for birth certificate evidence
   */
  public static createBirthCertificate(
    dependantId: string,
    documentUrl: string,
    description: string,
    uploadedBy: string,
    dateOfBirth: Date,
  ): DependantEvidence {
    return DependantEvidence.create({
      dependantId,
      type: EvidenceType.BIRTH_CERTIFICATE,
      documentUrl,
      description: `${description}. Date of birth: ${dateOfBirth.toISOString()}`,
      uploadedBy,
    });
  }

  // ===========================================================================
  // VALIDATION
  // ===========================================================================

  private validate(): void {
    // Validate document URL format
    if (!this.props.documentUrl || !this.props.documentUrl.startsWith('http')) {
      throw new Error('Document URL must be a valid HTTP/HTTPS URL');
    }

    // Validate evidence hasn't expired
    if (this.props.isExpired) {
      console.warn(`Warning: Evidence ${this.id.toString()} has expired`);
    }

    // Validate description is meaningful
    if (!this.props.description || this.props.description.trim().length < 10) {
      throw new Error('Evidence description must be at least 10 characters');
    }
  }

  // ===========================================================================
  // BUSINESS LOGIC
  // ===========================================================================

  /**
   * Verify the evidence
   */
  public verify(verifiedBy: string, validationNotes?: string, credibilityBoost?: number): void {
    if (this.props.isVerified) {
      throw new Error('Evidence is already verified');
    }

    if (this.props.isExpired) {
      throw new Error('Cannot verify expired evidence');
    }

    const updatedScore = this.props.validationScore + (credibilityBoost || 0);
    const finalScore = Math.min(100, updatedScore); // Cap at 100

    this.updateState({
      isVerified: true,
      verifiedBy,
      verifiedAt: new Date(),
      validationNotes,
      validationScore: finalScore,
    });
  }

  /**
   * Revoke verification (e.g., if evidence is disputed)
   */
  public revokeVerification(reason: string, _revokedBy: string): void {
    if (!this.props.isVerified) {
      throw new Error('Evidence is not verified');
    }

    this.updateState({
      isVerified: false,
      verifiedBy: undefined,
      verifiedAt: undefined,
      validationNotes: `Verification revoked: ${reason}. Previous notes: ${this.props.validationNotes}`,
      validationScore: Math.max(0, this.props.validationScore - 20), // Penalty
    });
  }

  /**
   * Mark evidence as expired
   */
  public markAsExpired(): void {
    this.updateState({
      isExpired: true,
    });
  }

  /**
   * Update document URL (e.g., replace with higher quality scan)
   */
  public updateDocument(newUrl: string, reason: string, _updatedBy: string): void {
    this.updateState({
      documentUrl: newUrl,
      isVerified: false, // Require reverification
      verifiedBy: undefined,
      verifiedAt: undefined,
      validationNotes: `Document updated: ${reason}. ${this.props.validationNotes || ''}`,
    });
  }

  // ===========================================================================
  // QUERIES & VALIDATION
  // ===========================================================================

  /**
   * Check if evidence is valid (verified and not expired)
   */
  public isValid(): boolean {
    return this.props.isVerified && !this.props.isExpired;
  }

  /**
   * Check if evidence is highly credible (>80 score)
   */
  public isHighlyCredible(): boolean {
    return this.props.validationScore > 80;
  }

  /**
   * Check if evidence requires reverification (e.g., after update)
   */
  public requiresReverification(): boolean {
    return !this.props.isVerified || this.props.isExpired;
  }

  // ===========================================================================
  // GETTERS
  // ===========================================================================

  get dependantId(): string {
    return this.props.dependantId;
  }

  get type(): EvidenceType {
    return this.props.type;
  }

  get documentUrl(): string {
    return this.props.documentUrl;
  }

  get description(): string {
    return this.props.description;
  }

  get isVerified(): boolean {
    return this.props.isVerified;
  }

  get isExpired(): boolean {
    return this.props.isExpired;
  }

  get validationScore(): number {
    return this.props.validationScore;
  }

  get uploadedBy(): string {
    return this.props.uploadedBy;
  }

  get uploadedAt(): Date {
    return this.props.uploadedAt;
  }

  get verifiedBy(): string | undefined {
    return this.props.verifiedBy;
  }

  get verifiedAt(): Date | undefined {
    return this.props.verifiedAt;
  }
}
