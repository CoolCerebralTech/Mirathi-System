// src/succession-automation/src/domain/entities/family-consent.entity.ts
import { Entity } from '../base/entity';
import { UniqueEntityID } from '../base/unique-entity-id';

/**
 * Family Consent Entity
 *
 * PURPOSE: Tracks consent from family members/beneficiaries (P&A 38 form).
 * Owned by: ProbateApplication Aggregate
 *
 * LEGAL CONTEXT:
 * Under S.56 LSA, certain family members must consent to the probate application:
 * - Surviving spouse(s)
 * - Adult children
 * - Named beneficiaries (if Will exists)
 * - Guardian of minor children
 *
 * DIGITAL SIGNATURES:
 * - SMS OTP: Sent to phone, user replies with code
 * - Email link: Click-to-consent with tokenized URL
 * - Biometric: For in-person scenarios
 * - Witness: For illiterate/elderly family members
 *
 * LIFECYCLE:
 * 1. Created when ProbateApplication is initiated
 * 2. PENDING → Consent request sent (SMS/Email)
 * 3. GRANTED/DECLINED → Family member responds
 * 4. NOT_REQUIRED → System determines consent not needed
 */

export enum ConsentStatus {
  PENDING = 'PENDING', // Waiting for response
  GRANTED = 'GRANTED', // Consented
  DECLINED = 'DECLINED', // Refused to consent
  NOT_REQUIRED = 'NOT_REQUIRED', // System determined not needed
  EXPIRED = 'EXPIRED', // Request expired without response
  WITHDRAWN = 'WITHDRAWN', // User withdrew consent after granting
}

export enum ConsentMethod {
  SMS_OTP = 'SMS_OTP', // SMS one-time password
  EMAIL_LINK = 'EMAIL_LINK', // Email with consent link
  DIGITAL_SIGNATURE = 'DIGITAL_SIGNATURE', // Electronic signature
  WET_SIGNATURE = 'WET_SIGNATURE', // Physical signature (scanned)
  BIOMETRIC = 'BIOMETRIC', // Fingerprint/face recognition
  WITNESS_MARK = 'WITNESS_MARK', // For illiterate persons
  IN_PERSON = 'IN_PERSON', // At court/advocate office
}

export enum FamilyRole {
  SURVIVING_SPOUSE = 'SURVIVING_SPOUSE',
  ADULT_CHILD = 'ADULT_CHILD',
  MINOR_CHILD = 'MINOR_CHILD',
  GUARDIAN_OF_MINOR = 'GUARDIAN_OF_MINOR',
  BENEFICIARY = 'BENEFICIARY',
  EXECUTOR = 'EXECUTOR',
  ADMINISTRATOR = 'ADMINISTRATOR',
  PARENT = 'PARENT',
  SIBLING = 'SIBLING',
  OTHER_RELATIVE = 'OTHER_RELATIVE',
}

interface FamilyConsentProps {
  // Identity
  familyMemberId: string; // Reference to FamilyMember in family-service
  fullName: string;
  nationalId?: string;
  phoneNumber?: string;
  email?: string;

  // Role & Relationship
  role: FamilyRole;
  relationshipToDeceased: string; // E.g., "Spouse", "Son", "Daughter"

  // Consent Status
  status: ConsentStatus;
  method?: ConsentMethod;

  // Request Tracking
  requestSentAt?: Date;
  requestSentVia?: string; // 'SMS' | 'EMAIL' | 'BOTH'
  requestExpiresAt?: Date; // Consent requests expire after 30 days

  // Response Tracking
  respondedAt?: Date;
  consentGivenAt?: Date;
  declinedAt?: Date;

  // Signature/Verification
  digitalSignatureId?: string; // Reference to stored signature
  signatureMethod?: ConsentMethod;
  verificationCode?: string; // SMS OTP code
  ipAddress?: string; // For digital consent audit
  deviceInfo?: string; // Browser/device fingerprint

  // Decline Reason
  declineReason?: string;
  declineCategory?: 'DISPUTE' | 'NOT_INFORMED' | 'DISAGREE_WITH_DISTRIBUTION' | 'OTHER';

  // Legal Representation
  hasLegalRepresentative: boolean;
  legalRepresentativeName?: string;
  legalRepresentativeContact?: string;

  // Withdrawal (if consent withdrawn)
  withdrawnAt?: Date;
  withdrawalReason?: string;

  // Notes
  notes?: string;
  internalNotes?: string; // Not shown to family member
}

export class FamilyConsent extends Entity<FamilyConsentProps> {
  private constructor(id: UniqueEntityID, props: FamilyConsentProps, createdAt?: Date) {
    super(id, props, createdAt);
  }

  // ==================== GETTERS ====================

  get familyMemberId(): string {
    return this.props.familyMemberId;
  }

  get fullName(): string {
    return this.props.fullName;
  }

  get nationalId(): string | undefined {
    return this.props.nationalId;
  }

  get phoneNumber(): string | undefined {
    return this.props.phoneNumber;
  }

  get email(): string | undefined {
    return this.props.email;
  }

  get role(): FamilyRole {
    return this.props.role;
  }

  get relationshipToDeceased(): string {
    return this.props.relationshipToDeceased;
  }

  get status(): ConsentStatus {
    return this.props.status;
  }

  get method(): ConsentMethod | undefined {
    return this.props.method;
  }

  get requestSentAt(): Date | undefined {
    return this.props.requestSentAt;
  }

  get requestExpiresAt(): Date | undefined {
    return this.props.requestExpiresAt;
  }

  get respondedAt(): Date | undefined {
    return this.props.respondedAt;
  }

  get consentGivenAt(): Date | undefined {
    return this.props.consentGivenAt;
  }

  get declineReason(): string | undefined {
    return this.props.declineReason;
  }

  get hasLegalRepresentative(): boolean {
    return this.props.hasLegalRepresentative;
  }

  // ==================== DERIVED PROPERTIES ====================

  /**
   * Has this consent been given?
   */
  public isGranted(): boolean {
    return this.props.status === ConsentStatus.GRANTED;
  }

  /**
   * Has this consent been declined?
   */
  public isDeclined(): boolean {
    return this.props.status === ConsentStatus.DECLINED;
  }

  /**
   * Is this consent still pending?
   */
  public isPending(): boolean {
    return this.props.status === ConsentStatus.PENDING;
  }

  /**
   * Is this consent expired?
   */
  public isExpired(): boolean {
    if (this.props.status === ConsentStatus.EXPIRED) return true;

    if (!this.props.requestExpiresAt) return false;

    return new Date() > this.props.requestExpiresAt;
  }

  /**
   * Is consent required from this person?
   */
  public isRequired(): boolean {
    return this.props.status !== ConsentStatus.NOT_REQUIRED;
  }

  /**
   * Can this consent be requested?
   */
  public canSendRequest(): boolean {
    return (
      this.props.status === ConsentStatus.PENDING &&
      (this.props.phoneNumber || this.props.email) &&
      !this.isExpired()
    );
  }

  /**
   * Days remaining until expiry
   */
  public getDaysUntilExpiry(): number | null {
    if (!this.props.requestExpiresAt) return null;

    const now = new Date();
    const expiry = this.props.requestExpiresAt;
    const diffMs = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    return Math.max(0, diffDays);
  }

  /**
   * Get priority score (for UI sorting)
   */
  public getPriorityScore(): number {
    // Higher score = higher priority
    let score = 0;

    // Role priority
    const rolePriority: Record<FamilyRole, number> = {
      [FamilyRole.SURVIVING_SPOUSE]: 100,
      [FamilyRole.GUARDIAN_OF_MINOR]: 90,
      [FamilyRole.EXECUTOR]: 80,
      [FamilyRole.ADMINISTRATOR]: 80,
      [FamilyRole.ADULT_CHILD]: 70,
      [FamilyRole.BENEFICIARY]: 60,
      [FamilyRole.PARENT]: 50,
      [FamilyRole.SIBLING]: 40,
      [FamilyRole.MINOR_CHILD]: 30,
      [FamilyRole.OTHER_RELATIVE]: 20,
    };
    score += rolePriority[this.props.role] || 0;

    // Status urgency
    if (this.props.status === ConsentStatus.DECLINED) {
      score += 50; // Disputes need immediate attention
    } else if (this.props.status === ConsentStatus.PENDING) {
      score += 30;
    }

    // Time urgency (expiring soon)
    const daysRemaining = this.getDaysUntilExpiry();
    if (daysRemaining !== null && daysRemaining <= 7) {
      score += (7 - daysRemaining) * 5; // More urgent as expiry approaches
    }

    return score;
  }

  // ==================== BUSINESS LOGIC ====================

  /**
   * Send consent request
   * BUSINESS RULE: Can only send if PENDING and has contact info
   */
  public sendConsentRequest(method: 'SMS' | 'EMAIL' | 'BOTH'): void {
    this.ensureNotDeleted();

    if (this.props.status !== ConsentStatus.PENDING) {
      throw new Error(`Cannot send request - status is ${this.props.status}`);
    }

    if (method === 'SMS' && !this.props.phoneNumber) {
      throw new Error('Cannot send SMS - no phone number');
    }

    if (method === 'EMAIL' && !this.props.email) {
      throw new Error('Cannot send email - no email address');
    }

    if (method === 'BOTH' && (!this.props.phoneNumber || !this.props.email)) {
      throw new Error('Cannot send both - missing contact info');
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days to respond

    this.updateState({
      requestSentAt: new Date(),
      requestSentVia: method,
      requestExpiresAt: expiresAt,
    });
  }

  /**
   * Grant consent
   * BUSINESS RULE: Can only grant if PENDING
   */
  public grantConsent(
    method: ConsentMethod,
    digitalSignatureId?: string,
    verificationCode?: string,
    ipAddress?: string,
    deviceInfo?: string,
  ): void {
    this.ensureNotDeleted();

    if (this.props.status !== ConsentStatus.PENDING) {
      throw new Error(`Cannot grant consent - status is ${this.props.status}`);
    }

    if (this.isExpired()) {
      throw new Error('Cannot grant consent - request has expired');
    }

    this.updateState({
      status: ConsentStatus.GRANTED,
      method,
      respondedAt: new Date(),
      consentGivenAt: new Date(),
      digitalSignatureId,
      signatureMethod: method,
      verificationCode,
      ipAddress,
      deviceInfo,
    });
  }

  /**
   * Decline consent
   * BUSINESS RULE: Can only decline if PENDING
   */
  public declineConsent(
    reason: string,
    category: 'DISPUTE' | 'NOT_INFORMED' | 'DISAGREE_WITH_DISTRIBUTION' | 'OTHER',
  ): void {
    this.ensureNotDeleted();

    if (this.props.status !== ConsentStatus.PENDING) {
      throw new Error(`Cannot decline consent - status is ${this.props.status}`);
    }

    this.updateState({
      status: ConsentStatus.DECLINED,
      respondedAt: new Date(),
      declinedAt: new Date(),
      declineReason: reason,
      declineCategory: category,
    });
  }

  /**
   * Withdraw consent (after granting)
   * BUSINESS RULE: Can only withdraw if GRANTED
   */
  public withdrawConsent(reason: string): void {
    this.ensureNotDeleted();

    if (this.props.status !== ConsentStatus.GRANTED) {
      throw new Error(`Cannot withdraw consent - status is ${this.props.status}`);
    }

    this.updateState({
      status: ConsentStatus.WITHDRAWN,
      withdrawnAt: new Date(),
      withdrawalReason: reason,
    });
  }

  /**
   * Mark as not required
   * BUSINESS RULE: Can only mark as not required if PENDING
   */
  public markAsNotRequired(reason?: string): void {
    this.ensureNotDeleted();

    if (this.props.status !== ConsentStatus.PENDING) {
      throw new Error(`Cannot mark as not required - status is ${this.props.status}`);
    }

    this.updateState({
      status: ConsentStatus.NOT_REQUIRED,
      internalNotes: reason,
    });
  }

  /**
   * Mark as expired
   * BUSINESS RULE: Called by system cron job
   */
  public markAsExpired(): void {
    this.ensureNotDeleted();

    if (this.props.status !== ConsentStatus.PENDING) {
      throw new Error(`Cannot mark as expired - status is ${this.props.status}`);
    }

    if (!this.isExpired()) {
      throw new Error('Cannot mark as expired - request has not expired yet');
    }

    this.updateState({
      status: ConsentStatus.EXPIRED,
    });
  }

  /**
   * Update contact information
   */
  public updateContactInfo(phoneNumber?: string, email?: string): void {
    this.ensureNotDeleted();

    this.updateState({
      phoneNumber: phoneNumber || this.props.phoneNumber,
      email: email || this.props.email,
    });
  }

  /**
   * Add notes (visible to family member)
   */
  public addNotes(notes: string): void {
    this.ensureNotDeleted();

    this.updateState({
      notes: this.props.notes ? `${this.props.notes}\n---\n${notes}` : notes,
    });
  }

  /**
   * Add internal notes (not visible to family member)
   */
  public addInternalNotes(notes: string): void {
    this.ensureNotDeleted();

    this.updateState({
      internalNotes: this.props.internalNotes
        ? `${this.props.internalNotes}\n---\n${notes}`
        : notes,
    });
  }

  // ==================== FACTORY METHODS ====================

  /**
   * Create a new pending consent request
   */
  public static createPending(
    familyMemberId: string,
    fullName: string,
    role: FamilyRole,
    relationshipToDeceased: string,
    contactInfo: {
      nationalId?: string;
      phoneNumber?: string;
      email?: string;
    },
  ): FamilyConsent {
    const id = UniqueEntityID.newID();

    return new FamilyConsent(id, {
      familyMemberId,
      fullName,
      nationalId: contactInfo.nationalId,
      phoneNumber: contactInfo.phoneNumber,
      email: contactInfo.email,
      role,
      relationshipToDeceased,
      status: ConsentStatus.PENDING,
      hasLegalRepresentative: false,
    });
  }

  /**
   * Create a consent marked as not required
   */
  public static createNotRequired(
    familyMemberId: string,
    fullName: string,
    role: FamilyRole,
    relationshipToDeceased: string,
    reason: string,
  ): FamilyConsent {
    const id = UniqueEntityID.newID();

    return new FamilyConsent(id, {
      familyMemberId,
      fullName,
      role,
      relationshipToDeceased,
      status: ConsentStatus.NOT_REQUIRED,
      hasLegalRepresentative: false,
      internalNotes: reason,
    });
  }

  /**
   * Reconstitute from persistence
   */
  public static reconstitute(
    id: string,
    props: FamilyConsentProps,
    createdAt: Date,
    updatedAt: Date,
  ): FamilyConsent {
    const entity = new FamilyConsent(new UniqueEntityID(id), props, createdAt);
    (entity as any)._updatedAt = updatedAt;
    return entity;
  }

  // ==================== SERIALIZATION ====================

  public toJSON(): Record<string, any> {
    return {
      id: this.id.toString(),
      familyMemberId: this.props.familyMemberId,
      fullName: this.props.fullName,
      nationalId: this.props.nationalId,
      phoneNumber: this.props.phoneNumber,
      email: this.props.email,
      role: this.props.role,
      relationshipToDeceased: this.props.relationshipToDeceased,
      status: this.props.status,
      method: this.props.method,
      requestSentAt: this.props.requestSentAt?.toISOString(),
      requestSentVia: this.props.requestSentVia,
      requestExpiresAt: this.props.requestExpiresAt?.toISOString(),
      respondedAt: this.props.respondedAt?.toISOString(),
      consentGivenAt: this.props.consentGivenAt?.toISOString(),
      declinedAt: this.props.declinedAt?.toISOString(),
      digitalSignatureId: this.props.digitalSignatureId,
      signatureMethod: this.props.signatureMethod,
      declineReason: this.props.declineReason,
      declineCategory: this.props.declineCategory,
      hasLegalRepresentative: this.props.hasLegalRepresentative,
      legalRepresentativeName: this.props.legalRepresentativeName,
      legalRepresentativeContact: this.props.legalRepresentativeContact,
      withdrawnAt: this.props.withdrawnAt?.toISOString(),
      withdrawalReason: this.props.withdrawalReason,
      notes: this.props.notes,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      // Derived
      isGranted: this.isGranted(),
      isDeclined: this.isDeclined(),
      isPending: this.isPending(),
      isExpired: this.isExpired(),
      isRequired: this.isRequired(),
      canSendRequest: this.canSendRequest(),
      daysUntilExpiry: this.getDaysUntilExpiry(),
      priorityScore: this.getPriorityScore(),
    };
  }
}
