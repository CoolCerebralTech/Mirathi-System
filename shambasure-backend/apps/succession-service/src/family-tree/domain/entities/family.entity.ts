import { AggregateRoot } from '@nestjs/cqrs';
import {
  DependencyLevel,
  GuardianAppointmentSource,
  GuardianType,
  InheritanceRights,
  RelationshipType,
} from '@prisma/client';

import { CustomaryMarriageRegisteredEvent } from '../events/customary-marriage-registered.event';
import { FamilyArchivedEvent } from '../events/family-archived.event';
import { FamilyCreatedEvent } from '../events/family-created.event';
import { FamilyMemberAddedEvent } from '../events/family-member-added.event';
import { FamilyTreeVisualizationUpdatedEvent } from '../events/family-tree-visualization-updated.event';
import { GuardianAssignedEvent } from '../events/guardian-assigned.event';

// Kenyan Legal Value Objects
export class KenyanDependantStatus {
  constructor(
    public readonly isDependant: boolean,
    public readonly dependencyLevel: DependencyLevel,
    public readonly inheritanceRights: InheritanceRights,
    public readonly traditionalInheritanceWeight: number,
  ) {}
}

export class KenyanRelationshipContext {
  constructor(
    public readonly isAdopted: boolean,
    public readonly isBiological: boolean,
    public readonly bornOutOfWedlock: boolean,
    public readonly isCustomaryAdoption: boolean,
    public readonly adoptionDate?: Date,
    public readonly adoptionOrderNumber?: string,
    public readonly courtOrderNumber?: string,
  ) {}
}

// Tree Visualization Interface
export interface TreeVisualizationData {
  nodes: Array<{
    id: string;
    label: string;
    type: 'person' | 'spouse' | 'deceased';
    data: {
      isDeceased?: boolean;
      isMinor?: boolean;
      dateOfBirth?: string;
      dateOfDeath?: string;
      relationshipType?: string;
      inheritanceRights?: InheritanceRights;
    };
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    label: string;
    type: 'marriage' | 'parent_child' | 'sibling' | 'guardianship';
    data: {
      marriageType?: string;
      marriageDate?: string;
      isAdopted?: boolean;
      guardianshipType?: string;
      inheritanceRights?: InheritanceRights;
    };
  }>;
  metadata: {
    generationCount: number;
    memberCount: number;
    deceasedCount: number;
    minorCount: number;
    lastCalculated: string;
    familyHeadId?: string;
    customaryMarriages: number;
    polygamousMarriages: number;
  };
}

// Family Reconstitution Interface
interface FamilyReconstitutionProps {
  id: string;
  creatorId: string;
  name: string;
  description?: string;

  // Kenyan Identity Fields (from Prisma schema)
  clanName?: string;
  subClan?: string;
  ancestralHome?: string;
  familyTotem?: string;
  familyHeadId?: string;

  // Legal Status (from Prisma schema)
  hasCustomaryMarriage: boolean;
  hasPolygamousMarriage: boolean;

  // Statistics (from Prisma schema)
  memberCount: number;
  livingMemberCount: number;
  minorCount: number;
  customaryMarriageCount: number;
  polygamousMarriageCount: number;

  treeData?: TreeVisualizationData | string | null;
  isActive?: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  deletedAt?: string | Date | null;
}

export class Family extends AggregateRoot {
  private id: string;
  private name: string;
  private description: string | null;
  private creatorId: string;

  // Kenyan Identity Fields (exactly matching Prisma schema)
  private clanName: string | null;
  private subClan: string | null;
  private ancestralHome: string | null;
  private familyTotem: string | null;
  private familyHeadId: string | null;

  // Legal Status Tracking (exactly matching Prisma schema)
  private hasCustomaryMarriage: boolean;
  private hasPolygamousMarriage: boolean;

  // Statistics (exactly matching Prisma schema)
  private memberCount: number;
  private livingMemberCount: number;
  private minorCount: number;
  private customaryMarriageCount: number;
  private polygamousMarriageCount: number;

  // Performance Optimization
  private treeData: TreeVisualizationData | null;

  // Lifecycle Tracking
  private isActive: boolean;
  private createdAt: Date;
  private updatedAt: Date;
  private deletedAt: Date | null;

  private constructor(id: string, creatorId: string, name: string, description?: string) {
    super();
    this.id = id;
    this.creatorId = creatorId;
    this.name = name;
    this.description = description || null;

    // Initialize Kenyan identity fields
    this.clanName = null;
    this.subClan = null;
    this.ancestralHome = null;
    this.familyTotem = null;
    this.familyHeadId = null;

    // Initialize legal status
    this.hasCustomaryMarriage = false;
    this.hasPolygamousMarriage = false;

    // Initialize statistics
    this.memberCount = 0;
    this.livingMemberCount = 0;
    this.minorCount = 0;
    this.customaryMarriageCount = 0;
    this.polygamousMarriageCount = 0;

    this.treeData = null;
    this.isActive = true;
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.deletedAt = null;
  }

  // --------------------------------------------------------------------------
  // FACTORY METHODS
  // --------------------------------------------------------------------------

  static create(id: string, creatorId: string, name: string, description?: string): Family {
    if (!name.trim()) throw new Error('Family name is required.');
    if (!creatorId) throw new Error('Family must have a creator.');

    const family = new Family(id, creatorId, name, description);

    family.apply(new FamilyCreatedEvent(id, creatorId, name, new Date()));

    return family;
  }

  static reconstitute(props: FamilyReconstitutionProps): Family {
    const family = new Family(props.id, props.creatorId, props.name, props.description);

    // Kenyan Identity Fields
    family.clanName = props.clanName || null;
    family.subClan = props.subClan || null;
    family.ancestralHome = props.ancestralHome || null;
    family.familyTotem = props.familyTotem || null;
    family.familyHeadId = props.familyHeadId || null;

    // Legal Status
    family.hasCustomaryMarriage = props.hasCustomaryMarriage;
    family.hasPolygamousMarriage = props.hasPolygamousMarriage;

    // Statistics
    family.memberCount = props.memberCount;
    family.livingMemberCount = props.livingMemberCount;
    family.minorCount = props.minorCount;
    family.customaryMarriageCount = props.customaryMarriageCount;
    family.polygamousMarriageCount = props.polygamousMarriageCount;

    // Tree Data
    if (props.treeData) {
      if (typeof props.treeData === 'string') {
        try {
          family.treeData = JSON.parse(props.treeData) as TreeVisualizationData;
        } catch (error) {
          family.treeData = null;
        }
      } else {
        family.treeData = props.treeData;
      }
    } else {
      family.treeData = null;
    }

    // Lifecycle
    family.isActive = props.isActive ?? true;
    family.createdAt =
      props.createdAt instanceof Date ? props.createdAt : new Date(props.createdAt);
    family.updatedAt =
      props.updatedAt instanceof Date ? props.updatedAt : new Date(props.updatedAt);
    family.deletedAt = props.deletedAt
      ? props.deletedAt instanceof Date
        ? props.deletedAt
        : new Date(props.deletedAt)
      : null;

    return family;
  }

  // --------------------------------------------------------------------------
  // KENYAN LEGAL BUSINESS LOGIC
  // --------------------------------------------------------------------------

  /**
   * Updates Kenyan identity fields as per family heritage records
   * Law of Succession Act recognizes customary family structures
   */
  updateKenyanIdentity(identity: {
    clanName?: string;
    subClan?: string;
    ancestralHome?: string;
    familyTotem?: string;
  }): void {
    if (identity.clanName !== undefined) this.clanName = identity.clanName;
    if (identity.subClan !== undefined) this.subClan = identity.subClan;
    if (identity.ancestralHome !== undefined) this.ancestralHome = identity.ancestralHome;
    if (identity.familyTotem !== undefined) this.familyTotem = identity.familyTotem;

    this.updatedAt = new Date();
  }

  /**
   * Registers a customary marriage according to Kenyan law
   * Law of Succession Act Section 3 defines "spouse" and recognizes customary marriages
   */
  registerCustomaryMarriage(marriageDetails: {
    spouse1Id: string;
    spouse2Id: string;
    marriageDate: Date;
    elderWitnesses: string[];
    bridePricePaid: boolean;
    bridePriceAmount?: number;
    ceremonyLocation: string;
    traditionalCeremonyType?: string;
    lobolaReceiptNumber?: string;
    marriageElderContact?: string;
    clanApproval?: boolean;
    familyConsent?: boolean;
    traditionalRitesPerformed?: string[];
  }): void {
    // Legal validation for customary marriage
    if (!marriageDetails.elderWitnesses || marriageDetails.elderWitnesses.length === 0) {
      throw new Error('Customary marriage requires elder witnesses as per Kenyan customary law.');
    }

    if (!marriageDetails.ceremonyLocation) {
      throw new Error('Ceremony location is required for customary marriage registration.');
    }

    this.hasCustomaryMarriage = true;
    this.customaryMarriageCount++;
    this.updatedAt = new Date();

    this.apply(
      new CustomaryMarriageRegisteredEvent(this.id, {
        ...marriageDetails,
        familyId: this.id,
      }),
    );
  }

  /**
   * Registers polygamous marriage structure
   * Law of Succession Act Section 40 specifically addresses polygamous families
   */
  registerPolygamousMarriage(): void {
    this.hasPolygamousMarriage = true;
    this.polygamousMarriageCount++;
    this.updatedAt = new Date();
  }

  /**
   * Appoints family head according to Kenyan customary law
   * Important for succession matters and family representation
   */
  appointFamilyHead(familyMemberId: string): void {
    if (!familyMemberId) {
      throw new Error('Family member ID is required for family head appointment.');
    }

    this.familyHeadId = familyMemberId;
    this.updatedAt = new Date();
  }

  /**
   * Assigns guardian for minors according to Kenyan law
   * Law of Succession Act provides for guardianship of minor beneficiaries
   */
  assignGuardian(guardianDetails: {
    guardianId: string;
    wardId: string;
    type: GuardianType;
    appointedBy: GuardianAppointmentSource;
    appointmentDate: Date;
    validUntil?: Date;
    courtOrderNumber?: string;
    courtName?: string;
    caseNumber?: string;
    issuingJudge?: string;
    courtStation?: string;
    conditions?: string[];
    reportingRequirements?: string[];
    restrictedPowers?: string[];
    specialInstructions?: string[];
    isTemporary?: boolean;
    reviewDate?: Date;
    notes?: string;
  }): void {
    // Legal validation
    if (guardianDetails.guardianId === guardianDetails.wardId) {
      throw new Error('Guardian cannot be the same as ward.');
    }

    if (guardianDetails.type === GuardianType.LEGAL_GUARDIAN && !guardianDetails.courtOrderNumber) {
      throw new Error('Legal guardian appointment requires court order number.');
    }

    this.updatedAt = new Date();

    this.apply(
      new GuardianAssignedEvent(this.id, {
        ...guardianDetails,
        familyId: this.id,
      }),
    );
  }

  // --------------------------------------------------------------------------
  // MEMBER MANAGEMENT WITH LEGAL COMPLIANCE
  // --------------------------------------------------------------------------

  /**
   * Adds family member with Kenyan succession law considerations
   * Law of Succession Act Section 29 defines dependants
   */
  addFamilyMember(memberDetails: {
    memberId: string;
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
    isDeceased?: boolean;
    dateOfDeath?: Date;
    isMinor: boolean;
    relationshipTo?: string;
    role: RelationshipType;
  }): void {
    // Legal validations
    if (memberDetails.isMinor && !memberDetails.dateOfBirth) {
      throw new Error('Minors must have date of birth for age verification.');
    }

    this.memberCount++;
    this.livingMemberCount += memberDetails.isDeceased ? 0 : 1;
    this.minorCount += memberDetails.isMinor ? 1 : 0;

    this.updatedAt = new Date();

    this.apply(new FamilyMemberAddedEvent(this.id, memberDetails));
  }

  /**
   * Updates member status with legal implications for succession rights
   */
  updateMemberStatus(updates: {
    memberId: string;
    becameDeceased?: boolean;
    becameAdult?: boolean;
    newMinor?: boolean;
    updatedRelationship?: RelationshipType;
  }): void {
    if (updates.becameDeceased) {
      this.livingMemberCount = Math.max(0, this.livingMemberCount - 1);
    }

    if (updates.becameAdult) {
      this.minorCount = Math.max(0, this.minorCount - 1);
    }

    if (updates.newMinor) {
      this.minorCount++;
    }

    this.updatedAt = new Date();
  }

  // --------------------------------------------------------------------------
  // KENYAN SUCCESSION LAW VALIDATION
  // --------------------------------------------------------------------------

  /**
   * Validates family structure compliance with Kenyan succession law
   * Law of Succession Act Sections 29, 35, 40, 66
   */
  validateForSuccession(): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Law of Succession Act Section 29 - Dependant validation
    if (this.memberCount === 0) {
      errors.push('Family must have at least one member for succession purposes.');
    }

    // Law of Succession Act Section 35-40 - Minor protection
    if (this.minorCount > 0) {
      if (!this.familyHeadId) {
        warnings.push(
          'Family with minors should have appointed family head for guardianship matters.',
        );
      }

      // Check for testamentary guardians or court-appointed guardians
      warnings.push(
        'Minors detected: Ensure proper guardianship arrangements for inheritance purposes.',
      );
    }

    // Customary law validation
    if (this.hasPolygamousMarriage) {
      if (!this.hasCustomaryMarriage) {
        warnings.push(
          'Polygamous marriages should be registered as customary marriages for legal recognition.',
        );
      }

      // Law of Succession Act Section 40 - Polygamous family provisions
      if (this.polygamousMarriageCount === 0) {
        warnings.push(
          'Polygamous family structure indicated but no polygamous marriages registered.',
        );
      }
    }

    // Succession readiness checks
    if (this.livingMemberCount === 0) {
      errors.push('No living family members available for succession.');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Determines if family can initiate probate process
   * Based on Law of Succession Act procedural requirements
   */
  canInitiateProbate(): { canProceed: boolean; reasons: string[] } {
    const validation = this.validateForSuccession();
    const reasons: string[] = [];

    if (!validation.isValid) {
      reasons.push(...validation.errors);
    }

    if (this.livingMemberCount === 0) {
      reasons.push('No living members to administer estate.');
    }

    if (this.memberCount === 0) {
      reasons.push('Family has no members.');
    }

    return {
      canProceed: reasons.length === 0,
      reasons,
    };
  }

  /**
   * Validates family structure for intestate succession
   * Law of Succession Act Part V - Intestate Succession
   */
  validateIntestateSuccessionStructure(): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];

    // Check for clear lineage relationships
    if (!this.familyHeadId) {
      issues.push('No family head appointed - may cause disputes in intestate succession.');
    }

    // Verify marriage records for spousal rights
    if (this.hasCustomaryMarriage && this.customaryMarriageCount === 0) {
      issues.push('Customary marriage indicated but no marriages registered.');
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  // --------------------------------------------------------------------------
  // STATISTICS & REPORTING
  // --------------------------------------------------------------------------

  getStatistics() {
    return {
      totalMembers: this.memberCount,
      livingMembers: this.livingMemberCount,
      minors: this.minorCount,
      deceased: this.memberCount - this.livingMemberCount,
      customaryMarriages: this.customaryMarriageCount,
      polygamousMarriages: this.polygamousMarriageCount,
      hasCustomaryMarriage: this.hasCustomaryMarriage,
      hasPolygamousMarriage: this.hasPolygamousMarriage,
      familyHeadAppointed: !!this.familyHeadId,
      clanIdentified: !!this.clanName,
      ancestralHomeRecorded: !!this.ancestralHome,
    };
  }

  // --------------------------------------------------------------------------
  // GETTERS (exactly matching Prisma schema fields)
  // --------------------------------------------------------------------------

  getId(): string {
    return this.id;
  }
  getCreatorId(): string {
    return this.creatorId;
  }
  getName(): string {
    return this.name;
  }
  getDescription(): string | null {
    return this.description;
  }
  getClanName(): string | null {
    return this.clanName;
  }
  getSubClan(): string | null {
    return this.subClan;
  }
  getAncestralHome(): string | null {
    return this.ancestralHome;
  }
  getFamilyTotem(): string | null {
    return this.familyTotem;
  }
  getFamilyHeadId(): string | null {
    return this.familyHeadId;
  }
  getHasCustomaryMarriage(): boolean {
    return this.hasCustomaryMarriage;
  }
  getHasPolygamousMarriage(): boolean {
    return this.hasPolygamousMarriage;
  }
  getMemberCount(): number {
    return this.memberCount;
  }
  getLivingMemberCount(): number {
    return this.livingMemberCount;
  }
  getMinorCount(): number {
    return this.minorCount;
  }
  getCustomaryMarriageCount(): number {
    return this.customaryMarriageCount;
  }
  getPolygamousMarriageCount(): number {
    return this.polygamousMarriageCount;
  }
  getTreeData(): TreeVisualizationData | null {
    return this.treeData;
  }
  getIsActive(): boolean {
    return this.isActive;
  }
  getCreatedAt(): Date {
    return this.createdAt;
  }
  getUpdatedAt(): Date {
    return this.updatedAt;
  }
  getDeletedAt(): Date | null {
    return this.deletedAt;
  }

  // Lifecycle methods remain the same...
  archive(archivedBy: string): void {
    if (!this.isActive) return;
    this.isActive = false;
    this.deletedAt = new Date();
    this.updatedAt = new Date();
    this.apply(new FamilyArchivedEvent(this.id, archivedBy));
  }

  restore(): void {
    this.isActive = true;
    this.deletedAt = null;
    this.updatedAt = new Date();
  }

  updateTreeVisualization(data: TreeVisualizationData): void {
    this.treeData = data;
    this.updatedAt = new Date();
    this.apply(new FamilyTreeVisualizationUpdatedEvent(this.id));
  }
}
