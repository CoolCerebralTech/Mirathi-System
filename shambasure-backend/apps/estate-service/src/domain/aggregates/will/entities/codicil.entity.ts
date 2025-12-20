import { Entity } from '../../../base/entity';
import { UniqueEntityID } from '../../../base/entity';
import { Result } from '../../../core/result';
import { DocumentReference } from '../../../shared/document-reference.vo';
import { LegalCapacity } from '../value-objects/legal-capacity.vo';
import { WitnessSignature } from '../value-objects/witness-signature.vo';

export enum CodicilType {
  ADDENDUM = 'ADDENDUM', // Adds new provisions
  AMENDMENT = 'AMENDMENT', // Changes existing provisions
  REPUBLICATION = 'REPUBLICATION', // Reconfirms the will with changes
  REVOCATION = 'REVOCATION', // Revokes specific provisions
  EXPLANATORY = 'EXPLANATORY', // Clarifies without changing
}

export enum CodicilStatus {
  DRAFT = 'DRAFT',
  PENDING_EXECUTION = 'PENDING_EXECUTION',
  EXECUTED = 'EXECUTED',
  WITNESSED = 'WITNESSED',
  VERIFIED = 'VERIFIED',
  REVOKED = 'REVOKED',
  SUPERSEDED = 'SUPERSEDED',
  CONTESTED = 'CONTESTED',
}

export enum CodicilExecutionMethod {
  IN_PERSON = 'IN_PERSON',
  VIDEO_CONFERENCE = 'VIDEO_CONFERENCE',
  REMOTE_SIGNING = 'REMOTE_SIGNING',
  ATTORNEY_CERTIFIED = 'ATTORNEY_CERTIFIED',
}

interface CodicilAmendment {
  sectionId: string; // Reference to will section
  originalText: string;
  amendedText: string;
  amendmentType: 'ADDITION' | 'DELETION' | 'REPLACEMENT' | 'CLARIFICATION';
  effectiveDate: Date;
  reason?: string;
}

interface CodicilWitness {
  witnessId: string;
  signature: WitnessSignature;
  signedAt: Date;
  relationshipToTestator: string;
  isProfessional: boolean;
}

interface CodicilProps {
  // Core Identity
  willId: string;
  codicilNumber: string; // Format: "Codicil-1", "Codicil-2-A", etc.
  title: string;
  type: CodicilType;
  status: CodicilStatus;

  // Content
  preamble: string; // "This is the first codicil to my last will..."
  amendments: CodicilAmendment[];
  explanatoryNotes?: string;
  revocationClauses?: string[]; // For REVOCATION type

  // Execution Details (Section 11 LSA compliance)
  executionDate?: Date;
  executionLocation?: string;
  executionMethod: CodicilExecutionMethod;
  isExecuted: boolean;
  executedByTestator: boolean;
  testatorSignatureData?: string; // Encrypted signature

  // Witness Requirements (Section 11 LSA)
  requiresWitnesses: boolean;
  minimumWitnessesRequired: number; // Typically 2 for Kenya
  witnesses: CodicilWitness[];
  allWitnessedAt?: Date;

  // Legal Capacity (Section 7 LSA)
  legalCapacity: LegalCapacity;
  capacityAssessedAt?: Date;
  capacityAssessedBy?: string;

  // Testator Details at Execution
  testatorAgeAtExecution?: number;
  testatorHealthStatus?: string;
  testatorAddressAtExecution?: string;

  // Relationship to Original Will
  supersedesCodicilId?: string; // If this replaces previous codicil
  referencesWillVersion: number; // Which version of will this amends
  effectiveDate: Date; // When changes take effect

  // Legal Formalities
  compliesWithFormalities: boolean;
  formalitiesVerifiedBy?: string;
  formalitiesVerifiedAt?: Date;
  formalitiesNotes?: string;

  // Court and Legal Proceedings
  courtRegistered: boolean;
  courtRegistrationNumber?: string;
  courtRegistrationDate?: Date;
  courtStation?: string;

  // Contestation
  isContested: boolean;
  contestationReason?: string;
  contestationFiledAt?: Date;
  contestationResolvedAt?: Date;

  // Revocation
  isRevoked: boolean;
  revokedAt?: Date;
  revocationReason?: string;
  revokedBy?: string; // Testator, court, etc.

  // Documentation
  documentReference: DocumentReference;
  supportingDocumentIds: string[];
  affidavitIds: string[]; // Supporting affidavits

  // Professional Involvement
  preparedByLawyer: boolean;
  lawyerName?: string;
  lawyerLicenseNumber?: string;
  lawFirm?: string;
  legalAdviceGiven: boolean;

  // Digital Trail
  digitalHash?: string; // For integrity verification
  previousVersionHash?: string; // For version chain

  // Audit
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export class Codicil extends Entity<CodicilProps> {
  get id(): UniqueEntityID {
    return this._id;
  }
  get willId(): string {
    return this.props.willId;
  }
  get type(): CodicilType {
    return this.props.type;
  }
  get status(): CodicilStatus {
    return this.props.status;
  }
  get isExecuted(): boolean {
    return this.props.isExecuted;
  }
  get isRevoked(): boolean {
    return this.props.isRevoked;
  }
  get isContested(): boolean {
    return this.props.isContested;
  }
  get legalCapacity(): LegalCapacity {
    return this.props.legalCapacity;
  }
  get executionDate(): Date | undefined {
    return this.props.executionDate;
  }
  get amendments(): CodicilAmendment[] {
    return this.props.amendments;
  }

  private constructor(props: CodicilProps, id?: UniqueEntityID) {
    super(props, id);
  }

  /**
   * Factory method to create a Codicil
   */
  public static create(props: Partial<CodicilProps>, id?: UniqueEntityID): Result<Codicil> {
    const defaultProps: CodicilProps = {
      willId: '',
      codicilNumber: '',
      title: '',
      type: CodicilType.AMENDMENT,
      status: CodicilStatus.DRAFT,
      preamble: '',
      amendments: [],
      executionMethod: CodicilExecutionMethod.IN_PERSON,
      isExecuted: false,
      executedByTestator: false,
      requiresWitnesses: true,
      minimumWitnessesRequired: 2,
      witnesses: [],
      legalCapacity: LegalCapacity.create({}).getValue(),
      referencesWillVersion: 1,
      effectiveDate: new Date(),
      compliesWithFormalities: false,
      courtRegistered: false,
      isContested: false,
      isRevoked: false,
      preparedByLawyer: false,
      legalAdviceGiven: false,
      documentReference: DocumentReference.create({ documentType: 'CODICIL' }).getValue(),
      supportingDocumentIds: [],
      affidavitIds: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mergedProps = { ...defaultProps, ...props };

    // Validate codicil properties
    const validationResult = this.validate(mergedProps);
    if (validationResult.isFailure) {
      return Result.fail<Codicil>(validationResult.getErrorValue());
    }

    // Generate codicil number if not provided
    if (!mergedProps.codicilNumber) {
      mergedProps.codicilNumber = `Codicil-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    }

    return Result.ok<Codicil>(new Codicil(mergedProps, id));
  }

  /**
   * Validate codicil properties against Kenyan law
   */
  private static validate(props: CodicilProps): Result<void> {
    const errors: string[] = [];

    // Basic validation
    if (!props.willId) {
      errors.push('Will ID is required');
    }

    if (!props.title || props.title.trim().length < 5) {
      errors.push('Title must be at least 5 characters');
    }

    if (!props.preamble) {
      errors.push('Preamble is required for legal validity');
    }

    // Type-specific validation
    switch (props.type) {
      case CodicilType.REVOCATION:
        if (!props.revocationClauses || props.revocationClauses.length === 0) {
          errors.push('Revocation codicil must specify clauses being revoked');
        }
        break;

      case CodicilType.AMENDMENT:
        if (props.amendments.length === 0) {
          errors.push('Amendment codicil must contain at least one amendment');
        }
        break;
    }

    // Witness validation
    if (props.requiresWitnesses && props.minimumWitnessesRequired < 2) {
      errors.push('Minimum of 2 witnesses required under Kenyan law');
    }

    // Execution validation
    if (props.isExecuted && !props.executionDate) {
      errors.push('Execution date is required if codicil is executed');
    }

    // Legal capacity validation
    if (props.isExecuted && !props.legalCapacity.hasLegalCapacity()) {
      errors.push('Testator must have legal capacity at execution');
    }

    // Effective date validation
    if (props.effectiveDate < new Date()) {
      errors.push('Effective date cannot be in the past');
    }

    if (errors.length > 0) {
      return Result.fail(errors.join('; '));
    }

    return Result.ok();
  }

  /**
   * Add an amendment to the codicil
   */
  public addAmendment(amendment: CodicilAmendment): Result<void> {
    if (this.props.status !== CodicilStatus.DRAFT) {
      return Result.fail('Cannot add amendments to non-draft codicil');
    }

    // Check if amendment to same section already exists
    const existingAmendment = this.props.amendments.find(
      (a) => a.sectionId === amendment.sectionId,
    );

    if (existingAmendment) {
      return Result.fail(`Amendment for section ${amendment.sectionId} already exists`);
    }

    this.props.amendments.push(amendment);
    this.props.updatedAt = new Date();

    return Result.ok();
  }

  /**
   * Remove an amendment
   */
  public removeAmendment(sectionId: string): Result<void> {
    if (this.props.status !== CodicilStatus.DRAFT) {
      return Result.fail('Cannot remove amendments from non-draft codicil');
    }

    const index = this.props.amendments.findIndex((a) => a.sectionId === sectionId);
    if (index === -1) {
      return Result.fail(`Amendment for section ${sectionId} not found`);
    }

    this.props.amendments.splice(index, 1);
    this.props.updatedAt = new Date();

    return Result.ok();
  }

  /**
   * Execute the codicil (testator signs)
   */
  public executeCodicil(
    signatureData: string,
    executionLocation: string,
    testatorAge: number,
    testatorHealthStatus?: string,
  ): Result<void> {
    if (this.props.status !== CodicilStatus.PENDING_EXECUTION) {
      return Result.fail(`Cannot execute codicil with status: ${this.props.status}`);
    }

    if (!this.props.legalCapacity.hasLegalCapacity()) {
      return Result.fail('Testator lacks legal capacity to execute codicil');
    }

    if (this.props.amendments.length === 0 && this.props.type !== CodicilType.EXPLANATORY) {
      return Result.fail('Codicil must have amendments before execution');
    }

    this.props.testatorSignatureData = signatureData;
    this.props.executionLocation = executionLocation;
    this.props.executionDate = new Date();
    this.props.isExecuted = true;
    this.props.executedByTestator = true;
    this.props.testatorAgeAtExecution = testatorAge;
    this.props.testatorHealthStatus = testatorHealthStatus;
    this.props.status = CodicilStatus.EXECUTED;
    this.props.updatedAt = new Date();

    return Result.ok();
  }

  /**
   * Add witness to codicil
   */
  public addWitness(witness: CodicilWitness): Result<void> {
    if (!this.props.isExecuted) {
      return Result.fail('Cannot add witnesses before codicil is executed');
    }

    if (
      this.props.status !== CodicilStatus.EXECUTED &&
      this.props.status !== CodicilStatus.WITNESSED
    ) {
      return Result.fail(`Cannot add witnesses to codicil with status: ${this.props.status}`);
    }

    // Check if witness already added
    const existingWitness = this.props.witnesses.find((w) => w.witnessId === witness.witnessId);
    if (existingWitness) {
      return Result.fail('Witness already added to this codicil');
    }

    // Check witness eligibility (not beneficiary, not executor, age ≥ 18)
    if (!this.validateWitnessEligibility(witness)) {
      return Result.fail('Witness is not eligible under Kenyan law');
    }

    this.props.witnesses.push(witness);
    this.props.status = CodicilStatus.WITNESSED;
    this.props.updatedAt = new Date();

    // Check if all required witnesses have signed
    this.checkWitnessCompletion();

    return Result.ok();
  }

  /**
   * Validate witness eligibility under Kenyan law
   */
  private validateWitnessEligibility(witness: CodicilWitness): boolean {
    // Basic checks
    if (!witness.signature || !witness.signature.isLegallyValid()) {
      return false;
    }

    // Age check
    if (witness.signature.props.witnessAge < 18) {
      return false;
    }

    // Cannot be beneficiary or executor
    if (witness.signature.props.isBeneficiary || witness.signature.props.isExecutor) {
      return false;
    }

    return true;
  }

  /**
   * Check if witness requirements are met
   */
  private checkWitnessCompletion(): void {
    if (this.props.witnesses.length >= this.props.minimumWitnessesRequired) {
      this.props.allWitnessedAt = new Date();
      this.props.status = CodicilStatus.VERIFIED;
      this.props.updatedAt = new Date();
    }
  }

  /**
   * Verify legal formalities
   */
  public verifyFormalities(verifiedBy: string, notes?: string): Result<void> {
    if (
      this.props.status !== CodicilStatus.WITNESSED &&
      this.props.status !== CodicilStatus.VERIFIED
    ) {
      return Result.fail('Cannot verify formalities before witnessing is complete');
    }

    // Check all requirements
    const requirementsMet = this.checkAllFormalities();
    if (!requirementsMet) {
      return Result.fail('Not all legal formalities are met');
    }

    this.props.compliesWithFormalities = true;
    this.props.formalitiesVerifiedBy = verifiedBy;
    this.props.formalitiesVerifiedAt = new Date();
    this.props.formalitiesNotes = notes;
    this.props.status = CodicilStatus.VERIFIED;
    this.props.updatedAt = new Date();

    return Result.ok();
  }

  /**
   * Check all legal formalities for Kenyan codicil
   */
  private checkAllFormalities(): boolean {
    // 1. Must be executed by testator
    if (!this.props.isExecuted || !this.props.executedByTestator) {
      return false;
    }

    // 2. Must have required witnesses
    if (
      this.props.requiresWitnesses &&
      this.props.witnesses.length < this.props.minimumWitnessesRequired
    ) {
      return false;
    }

    // 3. Testator must have legal capacity
    if (!this.props.legalCapacity.hasLegalCapacity()) {
      return false;
    }

    // 4. All witnesses must be eligible
    const allWitnessesEligible = this.props.witnesses.every((w) =>
      this.validateWitnessEligibility(w),
    );
    if (!allWitnessesEligible) {
      return false;
    }

    // 5. Execution date must be valid
    if (!this.props.executionDate || this.props.executionDate > new Date()) {
      return false;
    }

    return true;
  }

  /**
   * Revoke the codicil
   */
  public revokeCodicil(
    reason: string,
    revokedBy: string,
    method: 'TESTATOR' | 'COURT' | 'AUTOMATIC',
  ): Result<void> {
    if (this.props.isRevoked) {
      return Result.fail('Codicil is already revoked');
    }

    if (this.props.status === CodicilStatus.REVOKED) {
      return Result.fail('Codicil status is already REVOKED');
    }

    this.props.isRevoked = true;
    this.props.revokedAt = new Date();
    this.props.revocationReason = reason;
    this.props.revokedBy = revokedBy;
    this.props.status = CodicilStatus.REVOKED;
    this.props.updatedAt = new Date();

    return Result.ok();
  }

  /**
   * Contest the codicil
   */
  public contestCodicil(reason: string): Result<void> {
    if (this.props.isContested) {
      return Result.fail('Codicil is already contested');
    }

    if (this.props.isRevoked) {
      return Result.fail('Cannot contest a revoked codicil');
    }

    this.props.isContested = true;
    this.props.contestationReason = reason;
    this.props.contestationFiledAt = new Date();
    this.props.status = CodicilStatus.CONTESTED;
    this.props.updatedAt = new Date();

    return Result.ok();
  }

  /**
   * Resolve contestation
   */
  public resolveContestation(upheld: boolean, resolutionDetails: string): Result<void> {
    if (!this.props.isContested) {
      return Result.fail('Codicil is not contested');
    }

    this.props.isContested = false;
    this.props.contestationResolvedAt = new Date();

    if (upheld) {
      this.props.status = CodicilStatus.VERIFIED;
    } else {
      this.props.status = CodicilStatus.REVOKED;
      this.props.isRevoked = true;
      this.props.revocationReason = `Contestation resolved: ${resolutionDetails}`;
      this.props.revokedAt = new Date();
    }

    this.props.updatedAt = new Date();

    return Result.ok();
  }

  /**
   * Register with court
   */
  public registerWithCourt(courtStation: string, registrationNumber: string): Result<void> {
    if (this.props.status !== CodicilStatus.VERIFIED) {
      return Result.fail('Only verified codicils can be registered with court');
    }

    if (this.props.courtRegistered) {
      return Result.fail('Codicil already registered with court');
    }

    this.props.courtRegistered = true;
    this.props.courtStation = courtStation;
    this.props.courtRegistrationNumber = registrationNumber;
    this.props.courtRegistrationDate = new Date();
    this.props.updatedAt = new Date();

    return Result.ok();
  }

  /**
   * Add supporting document
   */
  public addSupportingDocument(documentId: string): void {
    if (!this.props.supportingDocumentIds.includes(documentId)) {
      this.props.supportingDocumentIds.push(documentId);
      this.props.updatedAt = new Date();
    }
  }

  /**
   * Add affidavit
   */
  public addAffidavit(affidavitId: string): void {
    if (!this.props.affidavitIds.includes(affidavitId)) {
      this.props.affidavitIds.push(affidavitId);
      this.props.updatedAt = new Date();
    }
  }

  /**
   * Mark as prepared by lawyer
   */
  public markAsLawyerPrepared(
    lawyerName: string,
    licenseNumber: string,
    lawFirm?: string,
  ): Result<void> {
    if (this.props.preparedByLawyer) {
      return Result.fail('Codicil already marked as lawyer-prepared');
    }

    this.props.preparedByLawyer = true;
    this.props.lawyerName = lawyerName;
    this.props.lawyerLicenseNumber = licenseNumber;
    this.props.lawFirm = lawFirm;
    this.props.legalAdviceGiven = true;
    this.props.updatedAt = new Date();

    return Result.ok();
  }

  /**
   * Get summary of amendments
   */
  public getAmendmentsSummary(): Array<{
    sectionId: string;
    amendmentType: string;
    effectiveDate: Date;
  }> {
    return this.props.amendments.map((amendment) => ({
      sectionId: amendment.sectionId,
      amendmentType: amendment.amendmentType,
      effectiveDate: amendment.effectiveDate,
    }));
  }

  /**
   * Check if codicil is legally valid
   */
  public isLegallyValid(): boolean {
    return (
      this.props.status === CodicilStatus.VERIFIED &&
      this.props.compliesWithFormalities &&
      this.props.legalCapacity.hasLegalCapacity() &&
      !this.props.isRevoked &&
      !this.props.isContested &&
      this.props.isExecuted &&
      this.props.executedByTestator &&
      this.props.witnesses.length >= this.props.minimumWitnessesRequired
    );
  }

  /**
   * Get witness summary for court filing
   */
  public getWitnessSummary(): Array<{
    name: string;
    relationship: string;
    signedAt: Date;
    isProfessional: boolean;
  }> {
    return this.props.witnesses.map((witness) => ({
      name: witness.signature.props.fullName,
      relationship: witness.relationshipToTestator,
      signedAt: witness.signedAt,
      isProfessional: witness.isProfessional,
    }));
  }

  /**
   * Calculate digital hash for integrity
   */
  public calculateDigitalHash(): string {
    const content = JSON.stringify({
      willId: this.props.willId,
      codicilNumber: this.props.codicilNumber,
      amendments: this.props.amendments,
      executionDate: this.props.executionDate,
      witnesses: this.props.witnesses.length,
    });

    // Simple hash calculation (in production, use proper cryptographic hash)
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }

    return hash.toString(36);
  }

  /**
   * Update digital trail
   */
  public updateDigitalTrail(): void {
    const newHash = this.calculateDigitalHash();
    this.props.previousVersionHash = this.props.digitalHash;
    this.props.digitalHash = newHash;
    this.props.updatedAt = new Date();
  }

  /**
   * Check if this codicil supersedes another
   */
  public supersedes(otherCodicilId: string): boolean {
    return this.props.supersedesCodicilId === otherCodicilId;
  }

  /**
   * Get effective amendments (filtered by date)
   */
  public getEffectiveAmendments(asOfDate: Date = new Date()): CodicilAmendment[] {
    return this.props.amendments.filter((amendment) => amendment.effectiveDate <= asOfDate);
  }
}
