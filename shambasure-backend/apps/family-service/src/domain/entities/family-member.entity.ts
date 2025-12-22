// domain/entities/family-member.entity.ts
import { Entity } from '../base/entity';
import { UniqueEntityID } from '../base/unique-entity-id';
import { InvalidFamilyMemberException } from '../exceptions/family.exception';
import { KenyanLocation } from '../value-objects/geographical/kenyan-location.vo';
import { BirthCertificate } from '../value-objects/identity/birth-certificate.vo';
import { DeathCertificate } from '../value-objects/identity/death-certificate.vo';
import { KenyanIdentity } from '../value-objects/identity/kenyan-identity.vo';
import { KraPin } from '../value-objects/identity/kra-pin.vo';
import { NationalId } from '../value-objects/identity/national-id.vo';
import { AgeCalculation } from '../value-objects/personal/age-calculation.vo';
import { ContactInfo } from '../value-objects/personal/contact-info.vo';
import { DemographicInfo } from '../value-objects/personal/demographic-info.vo';
import { DisabilityStatus } from '../value-objects/personal/disability-status.vo';
// Value Objects
import { KenyanName } from '../value-objects/personal/kenyan-name.vo';
import { LifeStatus } from '../value-objects/personal/life-status.vo';

/**
 * FamilyMember Entity Props (Immutable)
 *
 * Design Decision: FamilyMember is an ENTITY, not an Aggregate Root.
 * - It belongs to the Family aggregate
 * - It cannot exist independently
 * - State changes are coordinated by Family aggregate
 *
 * Kenyan Law Context:
 * - Represents individuals in succession proceedings
 * - Identity verification critical for S. 35/36/40 distribution
 * - Dependency status affects S. 29 dependant claims
 */
export interface FamilyMemberProps {
  // Core References
  userId?: UniqueEntityID; // Link to accounts-service User
  familyId: UniqueEntityID; // Parent aggregate

  // Single Source of Truth (Value Objects)
  name: KenyanName;
  identity: KenyanIdentity;
  lifeStatus: LifeStatus;

  // Optional Value Objects
  contactInfo?: ContactInfo;
  demographicInfo?: DemographicInfo;
  ageCalculation?: AgeCalculation;
  disabilityStatus?: DisabilityStatus;
  birthLocation?: KenyanLocation;
  deathLocation?: KenyanLocation;

  // Domain Primitives
  occupation?: string;

  // S. 40 LSA - Polygamous Family Context
  polygamousHouseId?: UniqueEntityID;

  // Archival (Soft Delete)
  isArchived: boolean;
  archivedAt?: Date;
  archivedBy?: UniqueEntityID;
  archivalReason?: string;
}

/**
 * Creation Props (Simplified for Factory)
 */
export interface CreateFamilyMemberProps {
  userId?: string;
  familyId: string;

  // Name
  firstName: string;
  lastName: string;
  middleName?: string;
  maidenName?: string;

  // Identity Documents
  nationalId?: string;
  kraPin?: string;
  birthCertificateNumber?: string;

  // Demographics
  dateOfBirth?: Date;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  citizenship?: 'KENYAN' | 'DUAL' | 'FOREIGN';
  religion?: string;
  ethnicity?: string;
  clan?: string;
  subClan?: string;

  // Contact
  phoneNumber?: string;
  email?: string;
  alternativePhone?: string;

  // Location
  placeOfBirth?: string;
  occupation?: string;

  // Disability
  hasDisability?: boolean;
  disabilityType?: string;
  requiresSupportedDecisionMaking?: boolean;

  // Death (if creating deceased member)
  isDeceased?: boolean;
  dateOfDeath?: Date;
  placeOfDeath?: string;
  deathCertificateNumber?: string;
}

/**
 * FamilyMember Entity
 *
 * Represents an individual within a Kenyan family structure.
 * Critical for succession law compliance (S. 29, 35, 36, 40 LSA).
 *
 * Design Patterns:
 * - Entity (not Aggregate Root) - belongs to Family aggregate
 * - Rich domain model - business logic in entity
 * - Value objects for complex attributes
 * - Immutable state changes via factory methods
 *
 * Kenyan Law Requirements:
 * - Identity verification (National ID, KRA PIN)
 * - Dependency assessment (S. 29 LSA)
 * - Age verification (minors, young adults)
 * - Disability status (dependant claims)
 * - Death certification (succession triggers)
 */
export class FamilyMember extends Entity<FamilyMemberProps> {
  private constructor(id: UniqueEntityID, props: FamilyMemberProps, createdAt?: Date) {
    super(id, props, createdAt);
    this.validate();
  }

  // =========================================================================
  // FACTORY METHODS
  // =========================================================================

  /**
   * Create new living family member
   *
   * Kenyan Law Context:
   * - Birth certificate for minors (S. 29 dependant proof)
   * - National ID for adults (identity verification)
   * - Citizenship affects succession rights
   */
  public static create(props: CreateFamilyMemberProps): FamilyMember {
    const id = new UniqueEntityID();
    const now = new Date();

    // Build Value Objects
    const name = FamilyMember.buildName(props);
    const identity = FamilyMember.buildIdentity(props);
    const lifeStatus = FamilyMember.buildLifeStatus(props);
    const contactInfo = FamilyMember.buildContactInfo(props);
    const demographicInfo = FamilyMember.buildDemographicInfo(props);
    const ageCalculation = props.dateOfBirth ? AgeCalculation.create(props.dateOfBirth) : undefined;
    const disabilityStatus = FamilyMember.buildDisabilityStatus(props);
    const birthLocation = FamilyMember.buildBirthLocation(props);

    const memberProps: FamilyMemberProps = {
      userId: props.userId ? new UniqueEntityID(props.userId) : undefined,
      familyId: new UniqueEntityID(props.familyId),
      name,
      identity,
      lifeStatus,
      contactInfo,
      demographicInfo,
      ageCalculation,
      disabilityStatus,
      birthLocation,
      deathLocation: props.placeOfDeath
        ? FamilyMember.buildDeathLocation(props.placeOfDeath)
        : undefined,
      occupation: props.occupation,
      isArchived: false,
    };

    return new FamilyMember(id, memberProps, now);
  }

  /**
   * Reconstitute from persistence (Repository)
   */
  public static fromPersistence(
    id: string,
    props: FamilyMemberProps,
    createdAt: Date,
    updatedAt?: Date,
  ): FamilyMember {
    const entityId = new UniqueEntityID(id);
    const member = new FamilyMember(entityId, props, createdAt);

    if (updatedAt) {
      (member as any)._updatedAt = updatedAt;
    }

    return member;
  }

  // =========================================================================
  // PRIVATE BUILDERS (Factory Helpers)
  // =========================================================================

  private static buildName(props: CreateFamilyMemberProps): KenyanName {
    let name = KenyanName.create(props.firstName, props.lastName, props.middleName);

    if (props.maidenName) {
      name = name.withMaidenName(props.maidenName);
    }

    return name;
  }

  private static buildIdentity(props: CreateFamilyMemberProps): KenyanIdentity {
    let identity = KenyanIdentity.create(
      (props.citizenship as 'KENYAN' | 'DUAL' | 'FOREIGN') || 'KENYAN',
    );

    // National ID
    if (props.nationalId) {
      const nationalId = NationalId.createUnverified(props.nationalId);
      identity = identity.withNationalId(nationalId);
    }

    // KRA PIN
    if (props.kraPin) {
      const kraPin = KraPin.create(props.kraPin);
      identity = identity.withKraPin(kraPin);
    }

    // Birth Certificate
    if (props.birthCertificateNumber && props.dateOfBirth) {
      const birthCert = BirthCertificate.create(
        props.birthCertificateNumber,
        props.dateOfBirth,
        new Date(), // registrationDate - default to now
        '', // motherName - can update later
        props.placeOfBirth || '',
      );
      identity = identity.withBirthCertificate(birthCert);
    }

    // Cultural Details
    if (props.ethnicity || props.religion || props.clan) {
      identity = identity.withCulturalDetails(
        props.ethnicity || '',
        props.religion || '',
        props.clan,
      );
    }

    return identity;
  }

  private static buildLifeStatus(props: CreateFamilyMemberProps): LifeStatus {
    if (props.isDeceased && props.dateOfDeath) {
      return LifeStatus.createDeceased(props.dateOfDeath);
    }
    return LifeStatus.createAlive();
  }

  private static buildContactInfo(props: CreateFamilyMemberProps): ContactInfo | undefined {
    if (!props.phoneNumber) return undefined;

    try {
      let contact = ContactInfo.create(props.phoneNumber, ''); // county can be updated

      if (props.email) {
        contact = contact.updateEmail(props.email);
      }

      if (props.alternativePhone) {
        contact = contact.updateSecondaryPhone(props.alternativePhone);
      }

      return contact;
    } catch (error) {
      console.warn('Invalid contact info:', error);
      return undefined;
    }
  }

  private static buildDemographicInfo(props: CreateFamilyMemberProps): DemographicInfo | undefined {
    if (!props.gender && !props.religion && !props.ethnicity) {
      return undefined;
    }

    let demographic = DemographicInfo.create();

    if (props.ethnicity) {
      demographic = demographic.updateEthnicity(props.ethnicity, props.subClan);
    }

    if (props.religion) {
      demographic = demographic.updateReligion(props.religion as any);
    }

    return demographic;
  }

  private static buildDisabilityStatus(
    props: CreateFamilyMemberProps,
  ): DisabilityStatus | undefined {
    if (!props.hasDisability && !props.requiresSupportedDecisionMaking) {
      return undefined;
    }

    let disability = DisabilityStatus.create(props.hasDisability || false);

    if (props.requiresSupportedDecisionMaking) {
      disability = disability.setSupportedDecisionMaking(true);
    }

    return disability;
  }

  private static buildBirthLocation(props: CreateFamilyMemberProps): KenyanLocation | undefined {
    if (!props.placeOfBirth) return undefined;

    try {
      return KenyanLocation.createFromProps({
        county: 'NAIROBI' as any, // Default - should be updated
        placeName: props.placeOfBirth,
        isUrban: false,
        isRural: true,
      });
    } catch (error) {
      console.warn('Could not create birth location:', error);
      return undefined;
    }
  }

  private static buildDeathLocation(placeOfDeath: string): KenyanLocation | undefined {
    try {
      return KenyanLocation.createFromProps({
        county: 'NAIROBI' as any, // Default - should be updated
        placeName: placeOfDeath,
        isUrban: false,
        isRural: true,
      });
    } catch (error) {
      console.warn('Could not create death location:', error);
      return undefined;
    }
  }

  // =========================================================================
  // VALIDATION (Invariants)
  // =========================================================================

  /**
   * Validate entity invariants (business rules that must always hold)
   *
   * Kenyan Law Requirements:
   * - Deceased members must have death date
   * - Date of birth cannot be after date of death
   * - Identity verification for legal proceedings
   */
  public validate(): void {
    // Core required fields
    if (!this.props.familyId) {
      throw new InvalidFamilyMemberException('Family ID is required');
    }

    if (!this.props.name) {
      throw new InvalidFamilyMemberException('Name is required');
    }

    if (!this.props.identity) {
      throw new InvalidFamilyMemberException('Identity is required');
    }

    if (!this.props.lifeStatus) {
      throw new InvalidFamilyMemberException('Life status is required');
    }

    // Death consistency
    if (this.props.lifeStatus.isDeceased && !this.props.lifeStatus.dateOfDeath) {
      throw new InvalidFamilyMemberException('Date of death is required for deceased members');
    }

    // Timeline consistency
    if (this.props.ageCalculation?.dateOfBirth && this.props.lifeStatus.dateOfDeath) {
      if (this.props.ageCalculation.dateOfBirth > this.props.lifeStatus.dateOfDeath) {
        throw new InvalidFamilyMemberException('Date of birth cannot be after date of death');
      }
    }

    // S. 40 LSA - Polygamous house constraints
    if (this.props.polygamousHouseId && this.isDeceased) {
      throw new InvalidFamilyMemberException(
        'Deceased members cannot be assigned to polygamous houses',
      );
    }
  }

  // =========================================================================
  // BUSINESS LOGIC (State Transitions)
  // =========================================================================

  /**
   * Update personal information
   * Returns new instance (immutable)
   */
  public updatePersonalInfo(params: {
    firstName?: string;
    lastName?: string;
    middleName?: string;
    maidenName?: string;
    occupation?: string;
  }): FamilyMember {
    this.ensureNotDeleted();
    this.ensureNotArchived();

    // Build new name
    let newName = this.props.name;
    if (params.firstName || params.lastName || params.middleName) {
      newName = KenyanName.create(
        params.firstName || this.props.name.firstName,
        params.lastName || this.props.name.lastName,
        params.middleName || this.props.name.middleName,
      );
    }

    if (params.maidenName) {
      newName = newName.withMaidenName(params.maidenName);
    }

    // Create new props (immutable update)
    const newProps: FamilyMemberProps = {
      ...this.props,
      name: newName,
      occupation: params.occupation || this.props.occupation,
    };

    return new FamilyMember(this._id, newProps, this._createdAt);
  }

  /**
   * Add National ID
   * Returns new instance
   */
  public addNationalId(idNumber: string): FamilyMember {
    this.ensureNotDeleted();
    this.ensureNotArchived();

    const nationalId = NationalId.createUnverified(idNumber);
    const newIdentity = this.props.identity.withNationalId(nationalId);

    const newProps: FamilyMemberProps = {
      ...this.props,
      identity: newIdentity,
    };

    return new FamilyMember(this._id, newProps, this._createdAt);
  }

  /**
   * Verify National ID
   * Critical for S. 35/36/40 inheritance distribution
   */
  public verifyNationalId(verifiedBy: string, verificationMethod: string): FamilyMember {
    this.ensureNotDeleted();
    this.ensureNotArchived();

    if (!this.props.identity.nationalId) {
      throw new InvalidFamilyMemberException('No national ID to verify');
    }

    const verifiedNationalId = this.props.identity.nationalId.verify(
      verifiedBy,
      verificationMethod,
    );
    const newIdentity = this.props.identity.withNationalId(verifiedNationalId);

    const newProps: FamilyMemberProps = {
      ...this.props,
      identity: newIdentity,
    };

    return new FamilyMember(this._id, newProps, this._createdAt);
  }

  /**
   * Add KRA PIN
   */
  public addKraPin(pinNumber: string): FamilyMember {
    this.ensureNotDeleted();
    this.ensureNotArchived();

    const kraPin = KraPin.create(pinNumber);
    const newIdentity = this.props.identity.withKraPin(kraPin);

    const newProps: FamilyMemberProps = {
      ...this.props,
      identity: newIdentity,
    };

    return new FamilyMember(this._id, newProps, this._createdAt);
  }

  /**
   * Verify KRA PIN (iTax system integration)
   */
  public verifyKraPin(verifiedBy: string, isTaxCompliant: boolean): FamilyMember {
    this.ensureNotDeleted();
    this.ensureNotArchived();

    if (!this.props.identity.kraPin) {
      throw new InvalidFamilyMemberException('No KRA PIN to verify');
    }

    const verifiedKraPin = this.props.identity.kraPin.verify(verifiedBy, isTaxCompliant);
    const newIdentity = this.props.identity.withKraPin(verifiedKraPin);

    const newProps: FamilyMemberProps = {
      ...this.props,
      identity: newIdentity,
    };

    return new FamilyMember(this._id, newProps, this._createdAt);
  }

  /**
   * Mark as deceased
   * Critical trigger for succession process (S. 83 LSA)
   */
  public markAsDeceased(params: {
    dateOfDeath: Date;
    placeOfDeath?: string;
    causeOfDeath?: string;
    deathCertificateNumber?: string;
    issuingAuthority?: string;
  }): FamilyMember {
    this.ensureNotDeleted();

    if (this.isDeceased) {
      throw new InvalidFamilyMemberException('Member is already marked as deceased');
    }

    if (params.dateOfDeath > new Date()) {
      throw new InvalidFamilyMemberException('Date of death cannot be in the future');
    }

    // Update life status
    const newLifeStatus = this.props.lifeStatus.markDeceased(
      params.dateOfDeath,
      params.placeOfDeath,
      params.causeOfDeath,
    );

    // Add death certificate if provided
    let newIdentity = this.props.identity;
    if (params.deathCertificateNumber) {
      const deathCertificate = DeathCertificate.createStandardCertificate(
        params.deathCertificateNumber,
        params.dateOfDeath,
        new Date(), // registrationDate
        params.placeOfDeath || '',
        'NAIROBI', // registrationDistrict - default
      );
      newIdentity = newIdentity.withDeathCertificate(deathCertificate);
    }

    const newProps: FamilyMemberProps = {
      ...this.props,
      lifeStatus: newLifeStatus,
      identity: newIdentity,
      deathLocation: params.placeOfDeath
        ? FamilyMember.buildDeathLocation(params.placeOfDeath)
        : undefined,
      isArchived: true, // Auto-archive deceased
      archivedAt: new Date(),
      archivalReason: 'Deceased',
    };

    return new FamilyMember(this._id, newProps, this._createdAt);
  }

  /**
   * Update disability status (affects S. 29 dependant claims)
   */
  public updateDisabilityStatus(params: {
    disabilityType: string;
    severity: 'MILD' | 'MODERATE' | 'SEVERE';
    requiresSupportedDecisionMaking: boolean;
  }): FamilyMember {
    this.ensureNotDeleted();
    this.ensureNotArchived();

    let newDisabilityStatus = this.props.disabilityStatus || DisabilityStatus.create(true);

    newDisabilityStatus = newDisabilityStatus.addDisability({
      type: params.disabilityType as any,
      severity: params.severity,
      requiresAssistance: params.requiresSupportedDecisionMaking,
    });

    newDisabilityStatus = newDisabilityStatus.setSupportedDecisionMaking(
      params.requiresSupportedDecisionMaking,
    );

    const newProps: FamilyMemberProps = {
      ...this.props,
      disabilityStatus: newDisabilityStatus,
    };

    return new FamilyMember(this._id, newProps, this._createdAt);
  }

  /**
   * Assign to polygamous house (S. 40 LSA)
   * Only applicable for children in polygamous families
   */
  public assignToPolygamousHouse(houseId: string): FamilyMember {
    this.ensureNotDeleted();
    this.ensureNotArchived();

    if (this.isDeceased) {
      throw new InvalidFamilyMemberException('Cannot assign deceased member to polygamous house');
    }

    const newProps: FamilyMemberProps = {
      ...this.props,
      polygamousHouseId: new UniqueEntityID(houseId),
    };

    return new FamilyMember(this._id, newProps, this._createdAt);
  }

  /**
   * Mark as missing (presumed alive but missing)
   */
  public markAsMissing(missingSince: Date, lastSeenLocation?: string): FamilyMember {
    this.ensureNotDeleted();
    this.ensureNotArchived();

    const newLifeStatus = this.props.lifeStatus.markMissing(missingSince, lastSeenLocation);

    const newProps: FamilyMemberProps = {
      ...this.props,
      lifeStatus: newLifeStatus,
    };

    return new FamilyMember(this._id, newProps, this._createdAt);
  }

  /**
   * Archive member (soft delete)
   * Required for legal retention (Data Protection Act 2019)
   */
  public archive(reason: string, archivedBy: string): FamilyMember {
    this.ensureNotDeleted();

    if (this.props.isArchived) {
      throw new InvalidFamilyMemberException('Member is already archived');
    }

    const newProps: FamilyMemberProps = {
      ...this.props,
      isArchived: true,
      archivedAt: new Date(),
      archivedBy: new UniqueEntityID(archivedBy),
      archivalReason: reason,
    };

    return new FamilyMember(this._id, newProps, this._createdAt);
  }

  // =========================================================================
  // GUARDS
  // =========================================================================

  private ensureNotArchived(): void {
    if (this.props.isArchived) {
      throw new InvalidFamilyMemberException(
        `Cannot modify archived member [${this._id.toString()}]`,
      );
    }
  }

  // =========================================================================
  // GETTERS (Read-Only Access)
  // =========================================================================

  get familyId(): UniqueEntityID {
    return this.props.familyId;
  }

  get userId(): UniqueEntityID | undefined {
    return this.props.userId;
  }

  get name(): KenyanName {
    return this.props.name;
  }

  get identity(): KenyanIdentity {
    return this.props.identity;
  }

  get lifeStatus(): LifeStatus {
    return this.props.lifeStatus;
  }

  get contactInfo(): ContactInfo | undefined {
    return this.props.contactInfo;
  }

  get demographicInfo(): DemographicInfo | undefined {
    return this.props.demographicInfo;
  }

  get ageCalculation(): AgeCalculation | undefined {
    return this.props.ageCalculation;
  }

  get disabilityStatus(): DisabilityStatus | undefined {
    return this.props.disabilityStatus;
  }

  get birthLocation(): KenyanLocation | undefined {
    return this.props.birthLocation;
  }

  get deathLocation(): KenyanLocation | undefined {
    return this.props.deathLocation;
  }

  get occupation(): string | undefined {
    return this.props.occupation;
  }

  get polygamousHouseId(): UniqueEntityID | undefined {
    return this.props.polygamousHouseId;
  }

  get isArchived(): boolean {
    return this.props.isArchived;
  }

  get archivedAt(): Date | undefined {
    return this.props.archivedAt;
  }

  get archivedBy(): UniqueEntityID | undefined {
    return this.props.archivedBy;
  }

  get archivalReason(): string | undefined {
    return this.props.archivalReason;
  }

  // =========================================================================
  // COMPUTED PROPERTIES (Kenyan Law Context)
  // =========================================================================

  /**
   * Is deceased (triggers succession process)
   */
  get isDeceased(): boolean {
    return this.props.lifeStatus.isDeceased;
  }

  /**
   * Is minor (affects S. 29 dependant status & S. 70 guardianship)
   * Kenyan Law: Minor = under 18 years
   */
  get isMinor(): boolean {
    if (this.isDeceased) return false;
    return this.props.ageCalculation?.isMinor || false;
  }

  /**
   * Current age (for S. 29 dependant assessment)
   */
  get currentAge(): number | null {
    return this.props.ageCalculation?.age || null;
  }

  /**
   * Date of birth (critical for age verification)
   */
  get dateOfBirth(): Date | undefined {
    return this.props.ageCalculation?.dateOfBirth;
  }

  /**
   * Date of death (succession trigger)
   */
  get dateOfDeath(): Date | undefined {
    return this.props.lifeStatus.dateOfDeath;
  }

  /**
   * Has verified identity (required for inheritance)
   */
  get isIdentityVerified(): boolean {
    return this.props.identity.isLegallyVerified;
  }

  /**
   * Has disability (affects S. 29 dependant claims)
   */
  get hasDisability(): boolean {
    return this.props.disabilityStatus?.hasDisability || false;
  }

  /**
   * Requires supported decision making (Mental Health Act 1989)
   */
  get requiresSupportedDecisionMaking(): boolean {
    return this.props.disabilityStatus?.requiresSupportedDecisionMaking || false;
  }

  /**
   * Is active (not archived, not deceased, presumed alive)
   */
  get isActive(): boolean {
    return !this.props.isArchived && !this.isDeceased && this.props.lifeStatus.isAlive;
  }

  /**
   * Is eligible for inheritance (S. 35/36/40 LSA)
   * Requirements:
   * 1. Not deceased
   * 2. Verified identity
   * 3. Presumed alive
   * 4. Not archived
   */
  get isEligibleForInheritance(): boolean {
    return (
      !this.isDeceased &&
      this.isIdentityVerified &&
      this.props.lifeStatus.isAlive &&
      !this.props.isArchived
    );
  }

  /**
   * Is potential dependant (S. 29 LSA)
   * Qualifies if:
   * 1. Minor
   * 2. Has disability
   * 3. Student (18-25 years)
   * 4. Elderly parent
   */
  get isPotentialDependant(): boolean {
    const isStudentAge = this.props.ageCalculation?.isYoungAdult || false;
    const isElderly = this.props.ageCalculation?.isElderly || false;

    return this.isMinor || this.hasDisability || isStudentAge || isElderly;
  }

  /**
   * Dependency level (for S. 29 provision calculation)
   */
  get dependencyLevel(): 'NONE' | 'PARTIAL' | 'FULL' {
    if (!this.isPotentialDependant) return 'NONE';

    // Full dependency: Severe disability or minor
    if (this.hasDisability && this.props.disabilityStatus?.hasSevereDisability) {
      return 'FULL';
    }

    if (this.isMinor) {
      return 'FULL';
    }

    // Partial dependency: Student age, mild disability
    if (this.props.ageCalculation?.isYoungAdult) {
      return 'PARTIAL';
    }

    return 'NONE';
  }

  /**
   * Missing since (for presumption of death)
   * Kenyan Law: 7 years missing = presumed dead
   */
  get missingSince(): Date | undefined {
    return this.props.lifeStatus.missingSince;
  }

  /**
   * Is Muslim (affects Islamic succession rules)
   */
  get isMuslim(): boolean {
    return this.props.demographicInfo?.isMuslim || false;
  }

  /**
   * Applies customary law (affects succession distribution)
   */
  get isCustomaryLawApplicable(): boolean {
    return this.props.identity.appliesCustomaryLaw;
  }

  /**
   * Gender (required for S. 40 polygamy rules)
   */
  get gender(): 'MALE' | 'FEMALE' | 'OTHER' | undefined {
    return this.props.demographicInfo?.gender as any;
  }

  /**
   * Religion (affects succession preferences)
   */
  get religion(): string | undefined {
    return this.props.demographicInfo?.religion;
  }

  /**
   * Ethnic group (for customary law application)
   */
  get ethnicGroup(): string | undefined {
    return this.props.demographicInfo?.ethnicGroup;
  }

  /**
   * Has death certificate (required for succession process)
   */
  get hasDeathCertificate(): boolean {
    return !!this.props.identity.deathCertificate;
  }

  /**
   * Maiden name (for married women - identity tracking)
   */
  get maidenName(): string | undefined {
    return this.props.name.maidenName;
  }

  // =========================================================================
  // SERIALIZATION
  // =========================================================================

  /**
   * Convert to plain object (for persistence/API)
   */
  public toPlainObject(): Record<string, any> {
    return {
      id: this._id.toString(),
      familyId: this.props.familyId.toString(),
      userId: this.props.userId?.toString(),

      // Value Objects
      name: this.props.name.toJSON(),
      identity: this.props.identity.toJSON(),
      lifeStatus: this.props.lifeStatus.toJSON(),
      contactInfo: this.props.contactInfo?.toJSON(),
      demographicInfo: this.props.demographicInfo?.toJSON(),
      ageCalculation: this.props.ageCalculation?.toJSON(),
      disabilityStatus: this.props.disabilityStatus?.toJSON(),
      birthLocation: this.props.birthLocation?.toJSON(),
      deathLocation: this.props.deathLocation?.toJSON(),

      // Primitives
      occupation: this.props.occupation,
      polygamousHouseId: this.props.polygamousHouseId?.toString(),

      // Computed properties
      isDeceased: this.isDeceased,
      isMinor: this.isMinor,
      currentAge: this.currentAge,
      isIdentityVerified: this.isIdentityVerified,
      hasDisability: this.hasDisability,
      requiresSupportedDecisionMaking: this.requiresSupportedDecisionMaking,
      isActive: this.isActive,
      isEligibleForInheritance: this.isEligibleForInheritance,
      isPotentialDependant: this.isPotentialDependant,
      dependencyLevel: this.dependencyLevel,

      // Archival
      isArchived: this.props.isArchived,
      archivedAt: this.props.archivedAt,
      archivedBy: this.props.archivedBy?.toString(),
      archivalReason: this.props.archivalReason,

      // Audit
      version: this._version,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      deletedAt: this._deletedAt,
    };
  }
}
