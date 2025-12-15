import { KenyanCounty as PrismaKenyanCounty } from '@prisma/client';

import { AggregateRoot } from '../base/aggregate-root';
import { FamilyMember } from '../entities/family-member.entity';
import { Marriage } from '../entities/marriage.entity';
import { PolygamousHouse } from '../entities/polygamous-house.entity';
import { FamilyCreatedEvent } from '../events/family-events/family-created.event';
import { FamilyMemberAddedEvent } from '../events/family-events/family-member-added.event';
import { FamilyMemberDeceasedEvent } from '../events/family-events/family-member-deceased.event';
import { FamilyMemberRemovedEvent } from '../events/family-events/family-member-removed.event';
import { FamilyUpdatedEvent } from '../events/family-events/family-updated.event';
import { MarriageRegisteredEvent } from '../events/marriage-events/marriage-registered.event';
import { PolygamousHouseCreatedEvent } from '../events/marriage-events/polygamous-house-created.event';
import {
  FamilyDomainException,
  InvalidFamilyMemberException,
  PolygamyComplianceException,
} from '../exceptions/family.exception';

export interface FamilyProps {
  id: string;
  name: string;
  description?: string;
  creatorId: string;

  // Kenyan Cultural Identity
  clanName?: string;
  subClan?: string;
  ancestralHome?: string;
  familyTotem?: string;
  homeCounty?: PrismaKenyanCounty;

  // Performance: Denormalized Counts
  memberCount: number;
  livingMemberCount: number;
  deceasedMemberCount: number;
  minorCount: number;
  dependantCount: number;

  // S. 40 Polygamy Tracking
  isPolygamous: boolean;
  polygamousHouseCount: number;

  // Versioning for concurrency control
  version: number;
  lastEventId?: string;

  // Audit
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  deletedBy?: string;
  deletionReason?: string;
  isArchived: boolean;

  // References to related entities (loaded separately)
  memberIds: string[];
  marriageIds: string[];
  polygamousHouseIds: string[];
}

export interface CreateFamilyProps {
  name: string;
  creatorId: string;
  description?: string;
  clanName?: string;
  subClan?: string;
  ancestralHome?: string;
  familyTotem?: string;
  homeCounty?: PrismaKenyanCounty;
  subCounty?: string;
  ward?: string;
  village?: string;
  placeName?: string;
}

export class Family extends AggregateRoot<FamilyProps> {
  private constructor(props: FamilyProps) {
    super(props.id, props);
    this.validate();
  }

  // --- Factory Methods ---

  static create(props: CreateFamilyProps): Family {
    const id = this.generateId();
    const now = new Date();

    const familyProps: FamilyProps = {
      id,
      name: props.name.trim(),
      description: props.description?.trim(),
      creatorId: props.creatorId,
      clanName: props.clanName?.trim(),
      subClan: props.subClan?.trim(),
      ancestralHome: props.ancestralHome?.trim(),
      familyTotem: props.familyTotem?.trim(),
      homeCounty: props.homeCounty,

      // Initialize counts
      memberCount: 0,
      livingMemberCount: 0,
      deceasedMemberCount: 0,
      minorCount: 0,
      dependantCount: 0,

      // Initialize polygamy status
      isPolygamous: false,
      polygamousHouseCount: 0,

      // State
      version: 1,
      lastEventId: undefined,
      createdAt: now,
      updatedAt: now,
      isArchived: false,

      // Relationships (empty initially)
      memberIds: [],
      marriageIds: [],
      polygamousHouseIds: [],
    };

    const family = new Family(familyProps);

    family.addDomainEvent(
      new FamilyCreatedEvent({
        familyId: family.id,
        creatorId: family.creatorId,
        name: family.name,
        clanName: family.clanName,
        homeCounty: family.homeCounty,
      }),
    );

    return family;
  }

  static createFromProps(props: FamilyProps): Family {
    return new Family(props);
  }

  // --- Domain Logic ---

  updateBasicInfo(params: {
    name?: string;
    description?: string;
    clanName?: string;
    subClan?: string;
    ancestralHome?: string;
    familyTotem?: string;
    homeCounty?: PrismaKenyanCounty;
  }): void {
    const oldName = this.props.name;
    const oldClanName = this.props.clanName;
    const oldHomeCounty = this.props.homeCounty;

    this.props.name = params.name?.trim() || this.props.name;
    this.props.description = params.description?.trim() ?? this.props.description;
    this.props.ancestralHome = params.ancestralHome?.trim() ?? this.props.ancestralHome;
    this.props.familyTotem = params.familyTotem?.trim() ?? this.props.familyTotem;
    this.props.clanName = params.clanName?.trim() ?? this.props.clanName;
    this.props.subClan = params.subClan?.trim() ?? this.props.subClan;
    this.props.homeCounty = params.homeCounty ?? this.props.homeCounty;

    this.props.updatedAt = new Date();
    this.props.version++;

    // Emit appropriate update events
    if (params.name && params.name.trim() !== oldName) {
      this.addDomainEvent(
        new FamilyUpdatedEvent({
          familyId: this.id,
          field: 'name',
          oldValue: oldName,
          newValue: this.props.name,
        }),
      );
    }

    if (params.clanName !== undefined && params.clanName !== oldClanName) {
      this.addDomainEvent(
        new FamilyUpdatedEvent({
          familyId: this.id,
          field: 'clanName',
          oldValue: oldClanName,
          newValue: params.clanName,
        }),
      );
    }

    if (params.homeCounty && params.homeCounty !== oldHomeCounty) {
      this.addDomainEvent(
        new FamilyUpdatedEvent({
          familyId: this.id,
          field: 'homeCounty',
          oldValue: oldHomeCounty,
          newValue: params.homeCounty,
        }),
      );
    }
  }

  // --- Member Management ---

  addMember(member: FamilyMember): void {
    if (member.familyId !== this.id) {
      throw new InvalidFamilyMemberException(
        `Member belongs to family ${member.familyId}, not ${this.id}`,
      );
    }

    if (this.props.memberIds.includes(member.id)) {
      return; // Idempotency
    }

    // Kenyan Legal Requirement: Verify National ID if adult
    if (!member.isMinor && !member.isIdentityVerified && !member.isDeceased) {
      console.warn(
        `Adult member ${member.id} added without verified National ID. Legal compliance issue.`,
      );
    }

    this.props.memberIds.push(member.id);
    this.props.memberCount++;

    // Update Counters based on Kenyan LSA categories
    if (member.isDeceased) {
      this.props.deceasedMemberCount++;
    } else {
      this.props.livingMemberCount++;

      if (member.isMinor) {
        this.props.minorCount++;
      }

      // Update dependant count based on S.29 criteria
      if (member.isPotentialDependant) {
        this.props.dependantCount++;
      }
    }

    this.props.updatedAt = new Date();
    this.props.version++;

    this.addDomainEvent(
      new FamilyMemberAddedEvent({
        familyId: this.id,
        memberId: member.id,
        firstName: member.name.firstName,
        lastName: member.name.lastName,
        isDeceased: member.isDeceased,
        isMinor: member.isMinor,
        isS29Dependant: member.isPotentialDependant,
      }),
    );
  }

  updateMemberStatus(member: FamilyMember): void {
    if (!this.props.memberIds.includes(member.id)) {
      throw new InvalidFamilyMemberException(`Member ${member.id} not found in family.`);
    }

    // Recalculate counts for this specific member
    // This method should be called after member updates
    console.warn('updateMemberStatus called - consider using event-driven updates instead');
  }

  recordMemberDeath(
    memberId: string,
    dateOfDeath: Date,
    deathCertificateNumber?: string,
    placeOfDeath?: string,
  ): void {
    if (!this.props.memberIds.includes(memberId)) {
      throw new InvalidFamilyMemberException(`Member ${memberId} not found in family.`);
    }

    // Note: This method is called when we only have the member ID, not the full member object
    // In production, we'd load the member to adjust counts accurately
    console.warn(
      'recordMemberDeath requires member details to adjust minor/dependant counts accurately. Using optimistic update.',
    );

    // Optimistic adjustments - will be corrected when member is loaded
    this.props.livingMemberCount--;
    this.props.deceasedMemberCount++;

    // Note: Minor and dependant counts need actual member data
    // We'll log a warning and rely on periodic recount

    this.props.updatedAt = new Date();
    this.props.version++;

    this.addDomainEvent(
      new FamilyMemberDeceasedEvent({
        familyMemberId: memberId,
        familyId: this.id,
        dateOfDeath,
        placeOfDeath,
        deathCertificateNumber,
        timestamp: new Date(),
      }),
    );
  }

  removeMember(member: FamilyMember): void {
    const index = this.props.memberIds.indexOf(member.id);
    if (index === -1) {
      return; // Idempotent
    }

    this.props.memberIds.splice(index, 1);
    this.props.memberCount--;

    // Adjust counters based on member status
    if (member.isDeceased) {
      this.props.deceasedMemberCount--;
    } else {
      this.props.livingMemberCount--;
      if (member.isMinor) {
        this.props.minorCount--;
      }
      if (member.isPotentialDependant) {
        this.props.dependantCount--;
      }
    }

    this.props.updatedAt = new Date();
    this.props.version++;

    this.addDomainEvent(
      new FamilyMemberRemovedEvent({
        familyId: this.id,
        memberId: member.id,
        wasDeceased: member.isDeceased,
        wasMinor: member.isMinor,
        wasDependant: member.isPotentialDependant,
      }),
    );
  }

  // --- Marriage Management ---

  registerMarriage(marriage: Marriage): void {
    if (marriage.familyId !== this.id) {
      throw new FamilyDomainException('Marriage does not belong to this family.');
    }

    if (this.props.marriageIds.includes(marriage.id)) {
      return; // Idempotency
    }

    // Validate Spouses exist in family
    if (
      !this.props.memberIds.includes(marriage.spouse1Id) ||
      !this.props.memberIds.includes(marriage.spouse2Id)
    ) {
      throw new FamilyDomainException(
        'Both spouses must be members of the family before registering marriage.',
      );
    }

    // Kenyan Legal Validation
    this.validateMarriageCompliance(marriage);

    this.props.marriageIds.push(marriage.id);

    // Update polygamy status if this is a polygamous marriage
    if (marriage.isPolygamous) {
      this.props.isPolygamous = true;
    }

    this.props.updatedAt = new Date();
    this.props.version++;

    // Access props safely via toJSON() or public interface
    const marriageData = marriage.toJSON();

    this.addDomainEvent(
      new MarriageRegisteredEvent({
        marriageId: marriage.id,
        familyId: this.id,
        spouse1Id: marriage.spouse1Id,
        spouse2Id: marriage.spouse2Id,
        marriageType: marriage.type,
        startDate: marriage.dates.marriageDate,
        registrationNumber: marriageData.registrationNumber,
      }),
    );
  }

  private validateMarriageCompliance(marriage: Marriage): void {
    // Access state via toJSON to avoid access modifiers issues in Aggregate
    const mState = marriage.toJSON();

    // Kenyan Marriage Act compliance checks
    if (marriage.dates.marriageDate > new Date()) {
      throw new FamilyDomainException('Marriage cannot start in the future.');
    }

    // S.40 Polygamy compliance
    if (marriage.isPolygamous && !mState.s40CertificateNumber) {
      throw new PolygamyComplianceException(
        'Polygamous marriages under S.40 require a certificate number.',
      );
    }

    // Customary marriage validation
    if (
      marriage.isCustomary &&
      mState.bridePrice?.status !== 'FULLY_PAID' &&
      mState.bridePrice?.status !== 'PARTIALLY_PAID'
    ) {
      console.warn(
        'Customary marriage registered without documented bride price payment (Status: ' +
          mState.bridePrice?.status +
          ').',
      );
    }

    // Islamic marriage validation
    if (marriage.isIslamic && !mState.islamicMarriage?.nikahDate) {
      throw new FamilyDomainException('Islamic marriage requires Nikah date.');
    }
  }

  // --- Polygamous House Management (S.40 LSA) ---

  addPolygamousHouse(house: PolygamousHouse): void {
    if (house.familyId !== this.id) {
      throw new FamilyDomainException('House does not belong to this family.');
    }

    if (this.props.polygamousHouseIds.includes(house.id)) {
      return; // Idempotency
    }

    // Validate House Head exists in family
    if (house.houseHeadId && !this.props.memberIds.includes(house.houseHeadId)) {
      throw new FamilyDomainException('House Head must be a family member.');
    }

    // S.40 Compliance: Wives consent for polygamous houses
    if (!house.wivesConsentObtained && house.houseOrder > 1) {
      throw new PolygamyComplianceException(
        'Subsequent polygamous house requires documented consent from existing wives.',
      );
    }

    this.props.polygamousHouseIds.push(house.id);
    this.props.polygamousHouseCount++;
    this.props.isPolygamous = true;

    this.props.updatedAt = new Date();
    this.props.version++;

    this.addDomainEvent(
      new PolygamousHouseCreatedEvent({
        houseId: house.id,
        familyId: this.id,
        houseName: house.houseName,
        houseOrder: house.houseOrder,
        houseHeadId: house.houseHeadId,
        establishedDate: house.establishedDate,
      }),
    );
  }

  removePolygamousHouse(houseId: string): void {
    const index = this.props.polygamousHouseIds.indexOf(houseId);
    if (index === -1) {
      return; // Idempotency
    }

    this.props.polygamousHouseIds.splice(index, 1);
    this.props.polygamousHouseCount--;

    // Update polygamy status if no houses left
    if (this.props.polygamousHouseCount === 0) {
      this.props.isPolygamous = false;
    }

    this.props.updatedAt = new Date();
    this.props.version++;

    this.addDomainEvent(
      new FamilyUpdatedEvent({
        familyId: this.id,
        field: 'polygamousHouseRemoved',
        oldValue: houseId,
        newValue: undefined,
      }),
    );
  }

  // --- Count Management ---

  recalculateCounts(members: FamilyMember[]): void {
    // Reset all counts
    this.props.livingMemberCount = 0;
    this.props.deceasedMemberCount = 0;
    this.props.minorCount = 0;
    this.props.dependantCount = 0;

    // Recalculate from member data
    members.forEach((member) => {
      if (member.isDeceased) {
        this.props.deceasedMemberCount++;
      } else {
        this.props.livingMemberCount++;
        if (member.isMinor) {
          this.props.minorCount++;
        }
        if (member.isPotentialDependant) {
          this.props.dependantCount++;
        }
      }
    });

    // Ensure memberCount matches
    this.props.memberCount = this.props.livingMemberCount + this.props.deceasedMemberCount;

    this.props.updatedAt = new Date();
    this.props.version++;
  }

  // --- Archive & Deletion ---

  archive(reason: string, deletedBy: string): void {
    if (this.props.isArchived) {
      throw new FamilyDomainException('Family is already archived.');
    }

    if (this.props.livingMemberCount > 0) {
      throw new FamilyDomainException('Cannot archive family with living members.');
    }

    this.props.isArchived = true;
    this.props.deletedAt = new Date();
    this.props.deletedBy = deletedBy;
    this.props.deletionReason = reason;
    this.props.updatedAt = new Date();
    this.props.version++;

    this.addDomainEvent(
      new FamilyUpdatedEvent({
        familyId: this.id,
        field: 'isArchived',
        oldValue: false,
        newValue: true,
      }),
    );
  }

  unarchive(): void {
    if (!this.props.isArchived) {
      throw new FamilyDomainException('Family is not archived.');
    }

    this.props.isArchived = false;
    this.props.deletedAt = undefined;
    this.props.deletedBy = undefined;
    this.props.deletionReason = undefined;
    this.props.updatedAt = new Date();
    this.props.version++;

    this.addDomainEvent(
      new FamilyUpdatedEvent({
        familyId: this.id,
        field: 'isArchived',
        oldValue: true,
        newValue: false,
      }),
    );
  }

  // --- Validation & Invariants ---

  private validate(): void {
    if (!this.props.id) {
      throw new FamilyDomainException('Family ID is required');
    }

    if (!this.props.name?.trim()) {
      throw new FamilyDomainException('Family name is required');
    }

    if (!this.props.creatorId) {
      throw new FamilyDomainException('Creator ID is required');
    }

    // Counts consistency
    if (this.props.memberCount < 0) {
      throw new FamilyDomainException('Member count cannot be negative');
    }

    if (this.props.livingMemberCount < 0 || this.props.deceasedMemberCount < 0) {
      throw new FamilyDomainException('Living/Deceased member counts cannot be negative');
    }

    if (this.props.memberCount !== this.props.livingMemberCount + this.props.deceasedMemberCount) {
      throw new FamilyDomainException('Member count must equal living + deceased members');
    }

    if (this.props.minorCount > this.props.livingMemberCount) {
      throw new FamilyDomainException('Minor count cannot exceed living member count');
    }

    if (this.props.dependantCount > this.props.livingMemberCount) {
      throw new FamilyDomainException('Dependant count cannot exceed living member count');
    }

    // Polygamy Consistency
    if (this.props.isPolygamous && this.props.polygamousHouseCount < 1) {
      console.warn('Polygamous family has no houses defined - may be in transition');
    }

    if (this.props.polygamousHouseCount < 0) {
      throw new FamilyDomainException('Polygamous house count cannot be negative');
    }

    // Archived validation
    if (this.props.isArchived && !this.props.deletedAt) {
      throw new FamilyDomainException('Archived family must have deletion timestamp');
    }

    if (this.props.deletedAt && !this.props.isArchived) {
      throw new FamilyDomainException('Deleted family must be archived');
    }
  }

  private static generateId(): string {
    return crypto.randomUUID
      ? crypto.randomUUID()
      : `fam-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // --- Getters ---

  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get creatorId(): string {
    return this.props.creatorId;
  }

  get clanName(): string | undefined {
    return this.props.clanName;
  }

  get subClan(): string | undefined {
    return this.props.subClan;
  }

  get ancestralHome(): string | undefined {
    return this.props.ancestralHome;
  }

  get familyTotem(): string | undefined {
    return this.props.familyTotem;
  }

  get homeCounty(): PrismaKenyanCounty | undefined {
    return this.props.homeCounty;
  }

  get memberCount(): number {
    return this.props.memberCount;
  }

  get livingMemberCount(): number {
    return this.props.livingMemberCount;
  }

  get deceasedMemberCount(): number {
    return this.props.deceasedMemberCount;
  }

  get minorCount(): number {
    return this.props.minorCount;
  }

  get dependantCount(): number {
    return this.props.dependantCount;
  }

  get isPolygamous(): boolean {
    return this.props.isPolygamous;
  }

  get polygamousHouseCount(): number {
    return this.props.polygamousHouseCount;
  }

  get version(): number {
    return this.props.version;
  }

  get lastEventId(): string | undefined {
    return this.props.lastEventId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get deletedAt(): Date | undefined {
    return this.props.deletedAt;
  }

  get deletedBy(): string | undefined {
    return this.props.deletedBy;
  }

  get deletionReason(): string | undefined {
    return this.props.deletionReason;
  }

  get isArchived(): boolean {
    return this.props.isArchived;
  }

  get memberIds(): string[] {
    return [...this.props.memberIds];
  }

  get marriageIds(): string[] {
    return [...this.props.marriageIds];
  }

  get polygamousHouseIds(): string[] {
    return [...this.props.polygamousHouseIds];
  }

  // Computed properties
  get hasLivingMembers(): boolean {
    return this.props.livingMemberCount > 0;
  }

  get hasDeceasedMembers(): boolean {
    return this.props.deceasedMemberCount > 0;
  }

  get hasMinors(): boolean {
    return this.props.minorCount > 0;
  }

  get hasDependants(): boolean {
    return this.props.dependantCount > 0;
  }

  get isActive(): boolean {
    return !this.props.isArchived && this.props.livingMemberCount > 0;
  }

  // S.40 Compliance
  get isS40Compliant(): boolean {
    if (!this.props.isPolygamous) {
      return true; // Monogamous families are automatically compliant
    }

    // For polygamous families under S.40:
    // 1. Must have houses defined
    // 2. Each house should have consent documentation
    // 3. Ideally court recognized
    return this.props.polygamousHouseCount > 0;
  }

  // S.29 Compliance
  get hasPotentialS29Claims(): boolean {
    return this.props.dependantCount > 0;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      creatorId: this.creatorId,
      clanName: this.clanName,
      subClan: this.subClan,
      ancestralHome: this.ancestralHome,
      familyTotem: this.familyTotem,
      homeCounty: this.homeCounty,
      memberCount: this.memberCount,
      livingMemberCount: this.livingMemberCount,
      deceasedMemberCount: this.deceasedMemberCount,
      minorCount: this.minorCount,
      dependantCount: this.dependantCount,
      isPolygamous: this.isPolygamous,
      polygamousHouseCount: this.polygamousHouseCount,
      hasLivingMembers: this.hasLivingMembers,
      hasDeceasedMembers: this.hasDeceasedMembers,
      hasMinors: this.hasMinors,
      hasDependants: this.hasDependants,
      isActive: this.isActive,
      isS40Compliant: this.isS40Compliant,
      hasPotentialS29Claims: this.hasPotentialS29Claims,
      version: this.version,
      lastEventId: this.lastEventId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
      deletedBy: this.deletedBy,
      deletionReason: this.deletionReason,
      isArchived: this.isArchived,
      memberIds: this.memberIds,
      marriageIds: this.marriageIds,
      polygamousHouseIds: this.polygamousHouseIds,
    };
  }
}
